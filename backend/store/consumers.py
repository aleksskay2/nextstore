


import json


from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django_redis import get_redis_connection


from urllib.parse import parse_qs



# Используем SET для хранения всех активных каналов юзера
ONLINE_SET_KEY = "online_channels:user:{user_id}" 
LAST_SEEN_KEY = "last_seen:user:{user_id}"
ONLINE_TTL = 300  # 5 минут. Это стандарт. Не бойтесь ставить больше.

class UserGlobalConsumer(AsyncJsonWebsocketConsumer):

    # ================= CONNECT =================

    async def connect(self):
        query_string = self.scope["query_string"].decode()
        token = parse_qs(query_string).get("token", [None])[0]

        from rest_framework_simplejwt.tokens import AccessToken

        if not token:
            await self.close()
            return

        try:
            access = AccessToken(token)
            self.user_id = int(access["user_id"])
            # Опционально: проверка существования юзера в БД, если нужно
            # self.user = await database_sync_to_async(get_user_model().objects.get)(id=self.user_id)
        except Exception:
            await self.close()
            return

        self.user_group = f"user_{self.user_id}"

        # Подписываемся на группы
        await self.channel_layer.group_add("users_global", self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

        # 🔥 ГЛАВНОЕ ИЗМЕНЕНИЕ: Добавляем текущий channel_name в Redis Set
        # is_first_connection вернет True, только если до этого список был пуст
        is_first_connection = await self.add_connection(self.user_id, self.channel_name)

        # Отправляем "Я Онлайн" только если это первое соединение (или если хотим обновлять статус всегда)
        # Чтобы не спамить, лучше проверять is_first_connection, но для надежности можно слать всегда, 
        # фронт должен уметь это обрабатывать (дедупликация).
        if is_first_connection:
            await self.channel_layer.group_send(
                "users_global",
                {
                    "type": "online_status",
                    "user_id": self.user_id,
                    "online": True,
                }
            )

        # Отправляем МНЕ список тех, кто онлайн сейчас
        online_users = await self.get_online_users()
        # Фильтруем себя, если не хотим видеть себя в списке
        users_to_send = [uid for uid in online_users if uid != self.user_id]
        
        # Можно отправить пачкой, чтобы не спамить сообщениями
        if users_to_send:
             # Либо циклом как у вас, либо одним сообщением (лучше одним, если фронт поддерживает)
            for uid in users_to_send:
                await self.send_json({
                    "type": "online_status",
                    "user_id": uid,
                    "online": True,
                })

    # ================= DISCONNECT =================

    async def disconnect(self, close_code):
         # ⛔ connect не завершился — просто выходим
        if not hasattr(self, "user_id"):
            return
        # 🔥 Удаляем только ЭТОТ канал из списка
        is_still_online = await self.remove_connection(self.user_id, self.channel_name)

        if not is_still_online:
            # Если соединений больше не осталось -> пользователь оффлайн
            await self.set_last_seen(self.user_id)
            
            await self.channel_layer.group_send(
                "users_global",
                {
                    "type": "online_status",
                    "user_id": self.user_id,
                    "online": False,
                }
            )

        await self.channel_layer.group_discard("users_global", self.channel_name)
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

    # ================= WS EVENTS =================

    async def receive_json(self, content):
        msg_type = content.get("type")

        # 1. Сначала обрабатываем ПИНГ и обновляем Redis
        if msg_type == "ping":
            # Пробуем обновить. Если ключ был мертв — восстанавливаем и возвращаем True
            was_dead = await self.refresh_online(self.user_id, self.channel_name)
            
            # 🔥 ЕСЛИ ЮЗЕР "ВОСКРЕС" (ключ протух, пока он спал) — УВЕДОМЛЯЕМ ВСЕХ
            if was_dead:
                await self.channel_layer.group_send(
                    "users_global",
                    {
                        "type": "online_status",
                        "user_id": self.user_id,
                        "online": True,
                    }
                )

            await self.send_json({"type": "pong"})
            return

        # Для всех остальных сообщений тоже обновляем активность, но молча
        await self.refresh_online(self.user_id, self.channel_name)

        if msg_type == "message_created":
            await self.handle_message_created(content)
        elif msg_type == "product_message_created":
            await self.handle_product_message_created(content)

        elif msg_type == "get_last_seen":
            user_id = content.get("user_id")
            # Проверяем онлайн через новый метод (проверка наличия ключа)
            online = await self.is_user_online(user_id)
            last_seen = None

            if not online:
                last_seen = await self.get_last_seen_ts(user_id)

            await self.send_json({
                "type": "last_seen",
                "user_id": user_id,
                "online": online,
                "last_seen": last_seen,
            })

    # ... (handle_message_created, send events остаются без изменений) ...
    async def handle_product_message_created(self, content):
        # Ваш код (без изменений)
        pass

    async def online_status(self, event):
        await self.send_json(event)
        
    async def message_delivered(self, event):
        await self.send_json(event) # упростил, отправляем как есть

    async def product_message_delivered(self, event):
         await self.send_json(event)

    # ================= REDIS LOGIC (ИСПРАВЛЕНО) =================

    @database_sync_to_async
    def add_connection(self, user_id, channel_name) -> bool:
        """
        Добавляет канал в Set. Возвращает True, если это ПЕРВОЕ соединение.
        """
        r = get_redis_connection("default")
        key = ONLINE_SET_KEY.format(user_id=user_id)
        
        # Используем pipeline для атомарности
        pipe = r.pipeline()
        pipe.sadd(key, channel_name)
        pipe.expire(key, ONLINE_TTL)
        pipe.scard(key) # Получаем количество элементов
        results = pipe.execute()
        
        count = results[2]
        # Если count == 1, значит до этого сета не было или он был пуст -> пользователь вошел
        return count == 1

    @database_sync_to_async
    def remove_connection(self, user_id, channel_name) -> bool:
        """
        Удаляет канал из Set. Возвращает True, если пользователь ВСЁ ЕЩЁ онлайн (есть другие вкладки).
        """
        r = get_redis_connection("default")
        key = ONLINE_SET_KEY.format(user_id=user_id)
        
        pipe = r.pipeline()
        pipe.srem(key, channel_name)
        pipe.scard(key)
        results = pipe.execute()
        
        count = results[1]
        
        if count == 0:
            # Если больше каналов нет, удаляем ключ полностью (на всякий случай)
            r.delete(key)
            return False # Стал оффлайн
            
        return True # Еще онлайн

    @database_sync_to_async
    def refresh_online(self, user_id, channel_name) -> bool:
        """
        Продлевает жизнь ключа. 
        Возвращает True, если ключ ПРИШЛОСЬ СОЗДАВАТЬ ЗАНОВО (юзер был offline).
        """
        r = get_redis_connection("default")
        key = ONLINE_SET_KEY.format(user_id=user_id)

        pipe = r.pipeline()
        pipe.ttl(key)              # 0. Проверяем, жив ли ключ (-2 = нет, -1 = вечный, >0 = жив)
        pipe.sadd(key, channel_name) # 1. Добавляем (на всякий случай)
        pipe.expire(key, ONLINE_TTL) # 2. Продлеваем
        results = pipe.execute()

        ttl_status = results[0]
        
        # Если ttl_status == -2, значит ключа НЕ БЫЛО, и он только что создался.
        # Значит, юзер считался "оффлайн" до этой секунды.
        return ttl_status == -2



    @database_sync_to_async
    def is_user_online(self, user_id):
        r = get_redis_connection("default")
        return r.exists(ONLINE_SET_KEY.format(user_id=user_id))

    @database_sync_to_async
    def get_online_users(self):
        r = get_redis_connection("default")
        # Ищем ключи по шаблону (осторожно, если юзеров миллионы - SCAN лучше KEYS)
        keys = r.keys("online_channels:user:*")
        users = []
        for k in keys:
            try:
                # k = b'online_channels:user:123'
                uid = int(k.decode().split(":")[-1])
                users.append(uid)
            except ValueError:
                continue
        return users

    @database_sync_to_async
    def set_last_seen(self, user_id):
        import time
        r = get_redis_connection("default")
        r.set(
            LAST_SEEN_KEY.format(user_id=user_id),
            int(time.time())
        )

    @database_sync_to_async
    def get_last_seen_ts(self, user_id):
        r = get_redis_connection("default")
        ts = r.get(LAST_SEEN_KEY.format(user_id=user_id))
        return int(ts) if ts else None

    async def story_created(self, event):
        await self.send_json({
            "type": "story_created",
            "story_id": event["story_id"],
            "author_id": event["author_id"],
        })

    async def story_viewed(self, event):
        await self.send_json({
            "type": "story_viewed",
            "story_id": event["story_id"],
            "viewer": event["viewer"],
        })

    async def story_deleted(self, event):
        await self.send_json({
            "type": "story_deleted",
            "story_id": event["story_id"],
            "author_id": event["author_id"],
        })


    # Handler для group_send (обязателен!)
    async def chat_update_event(self, event):
        await self.send_json({
            "type": "chat_update",
            "chat": event["chat"]
        })













import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django_redis import get_redis_connection


def active_chat_key(user_id: int) -> str:
    return f"active_chats:{user_id}"


# class PrivateChatConsumer(AsyncWebsocketConsumer):

#     # ==================================================
#     # CONNECT / DISCONNECT
#     # ==================================================
#     async def connect(self):
#         self.user_id = int(self.scope["url_route"]["kwargs"]["user_id"])
#         self.room_group_name = f"chat_{self.user_id}"

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.clear_active_chats(self.user_id)
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     # ==================================================
#     # RECEIVE
#     # ==================================================
#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         msg_type = data.get("type")

#         if msg_type == "message":
#             await self.handle_send_message(data)

#         elif msg_type == "chat_open":
#             await self.handle_chat_open(data)

#         # 🔥 ДОБАВЛЯЕМ СЮДА:
#         elif msg_type == "chat_close":
#             await self.handle_chat_close(data)

#         elif msg_type == "message_created":
#             await self.handle_existing_message(data)

#         elif msg_type == "product_message_created":
#             await self.handle_product_message_created(data)



#     # ... ниже добавь саму функцию:
#     async def handle_chat_close(self, data):
#         target = int(data.get("target", 0))
#         if target:
#             print(f"🛑 CHAT CLOSE: {self.user_id} -> {target}")
#             await self.remove_active_chat(self.user_id, target)
    
#     from asgiref.sync import sync_to_async

#     async def handle_product_message_created(self, content):
#         from .models import Message  # модель сообщений по товару
#         from django_redis import get_redis_connection

#         message_id = content.get("message_id")
#         receiver_id = content.get("receiver_id")
#         product_id = content.get("product_id")

#         if not message_id or not receiver_id or not product_id:
#             return

#         # получаем сообщение
#         msg = await database_sync_to_async(
#             lambda: Message.objects.get(id=message_id)
#         )()

#         # проверяем онлайн ли получатель
#         online_users = await sync_to_async(
#             lambda: get_redis_connection("default").smembers(ONLINE_USERS_KEY)
#         )()

#         if str(receiver_id).encode() not in online_users:
#             return

#         # помечаем delivered
#         await database_sync_to_async(
#             lambda: Message.objects.filter(id=message_id, is_delivered=False)
#             .update(is_delivered=True)
#         )()

#         # уведомляем все сессии отправителя и получателя
#         for uid in [msg.sender_id, msg.receiver_id]:
#             await self.channel_layer.group_send(
#                 f"user_{uid}",
#                 {
#                     "type": "product_message_delivered",
#                     "message_id": msg.id,
#                     "product_id": product_id,
#                     "receiver_id": msg.receiver_id,
#                 }
#             )



#     # ==================================================
#     # EXISTING MESSAGE
#     # ==================================================
#     async def handle_existing_message(self, data):
#         message_id = data["message_id"]
#         target = int(data["target"])

#         from .models import PrivateMessage

#         # msg = await database_sync_to_async(
#         #     lambda: PrivateMessage.objects.get(id=message_id)
#         # )()

#         msg = await database_sync_to_async(
#             lambda: PrivateMessage.objects
#                 .prefetch_related("files")
#                 .get(id=message_id)
#         )()


#         target_chat_open = await self.is_chat_open(target, self.user_id)

#         if target_chat_open:
#             await self.mark_delivered(msg.id)
#             await self.mark_read_single(msg.id)

#             msg = await database_sync_to_async(
#                 lambda: PrivateMessage.objects
#                     .prefetch_related("files")
#                     .get(id=msg.id)
#             )()

#         serialized = await self.serialize_message(msg)

#         await self.channel_layer.group_send(
#             f"chat_{target}",
#             {"type": "chat_message", "message": serialized}
#         )
#         await self.mark_delivered(msg.id)

#         await self.channel_layer.group_send(
#             f"chat_{self.user_id}",
#             {"type": "chat_message", "message": serialized}
#         )

#         await self.channel_layer.group_send(
#             f"chat_{self.user_id}",
#             {"type": "message_delivered", "message_id": msg.id}
#         )

#         if target_chat_open:
#             await self.channel_layer.group_send(
#                 f"chat_{self.user_id}",
#                 {"type": "messages_read", "message_ids": [msg.id]}
#             )

#     # ==================================================
#     # SEND MESSAGE
#     # ==================================================
#     async def handle_send_message(self, data):
#         text = data["text"]
#         target = int(data["target"])
#         temp_id = data.get("temp_id")

#         msg = await self.create_message(self.user_id, target, text)

#         target_chat_open = await self.is_chat_open(target, self.user_id)

#         if target_chat_open:
#             await self.mark_delivered(msg.id)
#             await self.mark_read_single(msg.id)

#             from .models import PrivateMessage
#             msg = await database_sync_to_async(
#                 lambda: PrivateMessage.objects
#                     .prefetch_related("files")
#                     .get(id=msg.id)
#             )()


#         serialized = await self.serialize_message(msg)
#         # serialized["temp_id"] = temp_id

#         await self.channel_layer.group_send(
#             f"chat_{target}",
#             {"type": "chat_message", "message": serialized}
#         )

#         await self.channel_layer.group_send(
#             f"chat_{self.user_id}",
#             {"type": "chat_message", "message": serialized}
#         )

#         # await self.channel_layer.group_send(
#         #     f"chat_{self.user_id}",
#         #     {
#         #         "type": "message_delivered",
#         #         "message_id": msg.id, 
#         #         "receiver_id": target
#         #         # "temp_id": temp_id
#         #     }
#         # )

#         if await self.is_user_online(target):
#             await self.channel_layer.group_send(
#                 f"user_{target}",        # глобальная группа получателя
#                 {"type": "message_delivered", "message_id": msg.id, "receiver_id": target}
#             )

#         if target_chat_open:
#             await self.channel_layer.group_send(
#                 f"chat_{target}",
#                 {
#                     "type": "messages_read",
#                     "message_ids": [msg.id],
#                     "reader_id": self.user_id
#                 }
#             )

#     # ==================================================
#     # CHAT OPEN
#     # ==================================================
#     async def handle_chat_open(self, data):
#         other_user_id = int(data["target"])
#         print(f"🔥 CHAT OPEN: {self.user_id} -> {other_user_id}")

#         await self.add_active_chat(self.user_id, other_user_id)

#         message_ids = await self.mark_messages_read(
#             reader_id=self.user_id,
#             sender_id=other_user_id
#         )

#         if not message_ids:
#             return

#         payload = {
#             "type": "messages_read",
#             "message_ids": message_ids,
#             "reader_id": self.user_id,
#         }

#         await self.channel_layer.group_send(
#             f"chat_{other_user_id}",
#             payload
#         )

#         await self.channel_layer.group_send(
#             f"chat_{self.user_id}",
#             payload
#         )


#     @database_sync_to_async
#     def is_user_online(self, user_id: int):
#         r = get_redis_connection("default")
#         return r.sismember("online_users", user_id)


#     # ==================================================
#     # REDIS HELPERS
#     # ==================================================
#     @database_sync_to_async
#     def add_active_chat(self, user_id: int, target_id: int):
#         r = get_redis_connection("default")
#         r.sadd(active_chat_key(user_id), target_id)
#         r.expire(active_chat_key(user_id), 60 * 60)

#     @database_sync_to_async
#     def clear_active_chats(self, user_id: int):
#         r = get_redis_connection("default")
#         r.delete(active_chat_key(user_id))

#     @database_sync_to_async
#     def is_chat_open(self, user_id: int, target_id: int) -> bool:
#         r = get_redis_connection("default")
#         return r.sismember(active_chat_key(user_id), target_id)

#     # ==================================================
#     # DB HELPERS
#     # ==================================================
#     @database_sync_to_async
#     def create_message(self, sender_id, target_id, text):
#         from .models import PrivateMessage
#         return PrivateMessage.objects.create(
#             sender_id=sender_id,
#             target_id=target_id,
#             text=text,
#             is_delivered=False,
#             is_read=False
#         )

#     @database_sync_to_async
#     def mark_delivered(self, message_id):
#         from .models import PrivateMessage
#         PrivateMessage.objects.filter(id=message_id).update(is_delivered=True)

#     @database_sync_to_async
#     def mark_read_single(self, message_id):
#         from .models import PrivateMessage
#         PrivateMessage.objects.filter(id=message_id).update(is_read=True)

#     @database_sync_to_async
#     def mark_messages_read(self, reader_id, sender_id):
#         from .models import PrivateMessage
#         qs = PrivateMessage.objects.filter(
#             sender_id=sender_id,
#             target_id=reader_id,
#             is_read=False
#         )
#         ids = list(qs.values_list("id", flat=True))
#         qs.update(is_read=True)
#         return ids

#     @database_sync_to_async
#     def serialize_message(self, msg):
#         print("files ", [
#             (f.id, f.type)
#             for f in msg.files.all()
#         ])
#         return {
#             "id": msg.id,
#             "text": msg.text,
#             "created_at": msg.created_at.isoformat(),
#             "is_delivered": msg.is_delivered,
#             "is_read": msg.is_read,
#             "sender_id": msg.sender_id,
#             "target_id": msg.target_id,
#             "files": [
#                 {
#                     "id": f.id,
#                     "url": f.file.url,
#                     "type": f.type,
#                     "duration": f.duration,
#                 }
#                 for f in msg.files.all()
#             ]
#         }

#     # ==================================================
#     # WS OUT
#     # ==================================================
#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "type": "message",
#             "message": event["message"]
#         }))

#     async def messages_read(self, event):
#         await self.send(text_data=json.dumps({
#             "type": "read",
#             "message_ids": event["message_ids"]
#         }))

#     async def message_delivered(self, event):
#         await self.send(text_data=json.dumps({
#             "type": "delivered",
#             "message_id": event["message_id"]
#         }))


#     async def chat_update_event(self, event):
#         await self.send_json({
#             "type": "chat_update",
#             "chat": event["chat"]
#         })

#     async def message_deleted(self, event):
#         """Вызывается при удалении сообщения"""
#         await self.send(text_data=json.dumps({
#             "type": "message_deleted",
#             "message_id": event["message_id"]
#         }))

#     # ... в самом низу, в разделе REDIS HELPERS добавь этот метод:
#     @database_sync_to_async
#     def remove_active_chat(self, user_id: int, target_id: int):
#         r = get_redis_connection("default")
#         r.srem(active_chat_key(user_id), target_id)








class PrivateChatConsumer(AsyncWebsocketConsumer):

    # ==================================================
    # CONNECT / DISCONNECT
    # ==================================================
    async def connect(self):
        self.user_id = int(self.scope["url_route"]["kwargs"]["user_id"])
        self.room_group_name = f"chat_{self.user_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.clear_active_chats(self.user_id)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # ==================================================
    # RECEIVE
    # ==================================================
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if msg_type == "message":
            await self.handle_send_message(data)

        elif msg_type == "chat_open":
            await self.handle_chat_open(data)

        elif msg_type == "chat_close":
            await self.handle_chat_close(data)

        # 🔥 🔥 🔥 ДОБАВЛЕНО: Перехват мгновенного прочтения сообщения из открытого чата
        elif msg_type == "message_read":
            await self.handle_message_read(data)

        elif msg_type == "message_created":
            await self.handle_existing_message(data)

        elif msg_type == "product_message_created":
            await self.handle_product_message_created(data)

    # ==================================================
    # HANDLERS
    # ==================================================
    async def handle_chat_close(self, data):
        target = int(data.get("target", 0))
        if target:
            print(f"🛑 CHAT CLOSE: {self.user_id} -> {target}")
            await self.remove_active_chat(self.user_id, target)

    # 🔥 🔥 🔥 ДОБАВЛЕНО: Метод обработки отчета о прочтении отдельного сообщения
    async def handle_message_read(self, data):
        message_id = data.get("message_id")
        target = int(data.get("target", 0))
        
        if message_id and target:
            # 1. Записываем статус в PostgreSQL
            await self.mark_read_single(message_id)
            
            payload = {
                "type": "messages_read",
                "message_ids": [message_id],
                "reader_id": self.user_id,
            }
            
            # 2. Уведомляем собеседника, чтобы у него зажглись галочки прочтения
            await self.channel_layer.group_send(f"chat_{target}", payload)
            # 3. Уведомляем другие свои сессии
            await self.channel_layer.group_send(f"chat_{self.user_id}", payload)

    async def handle_product_message_created(self, content):
        from .models import Message  # модель сообщений по товару

        message_id = content.get("message_id")
        receiver_id = content.get("receiver_id")
        product_id = content.get("product_id")

        if not message_id or not receiver_id or not product_id:
            return

        msg = await database_sync_to_async(
            lambda: Message.objects.get(id=message_id)
        )()

        # Проверяем онлайн ли получатель (предполагается, что константа ONLINE_USERS_KEY импортирована или заменена на строку)
        ONLINE_USERS_KEY = "online_users"
        online_users = await sync_to_async(
            lambda: get_redis_connection("default").smembers(ONLINE_USERS_KEY)
        )()

        if str(receiver_id).encode() not in online_users:
            return

        await database_sync_to_async(
            lambda: Message.objects.filter(id=message_id, is_delivered=False)
            .update(is_delivered=True)
        )()

        for uid in [msg.sender_id, msg.receiver_id]:
            await self.channel_layer.group_send(
                f"user_{uid}",
                {
                    "type": "product_message_delivered",
                    "message_id": msg.id,
                    "product_id": product_id,
                    "receiver_id": msg.receiver_id,
                }
            )

    # ==================================================
    # EXISTING MESSAGE
    # ==================================================
    async def handle_existing_message(self, data):
        message_id = data["message_id"]
        target = int(data["target"])

        from .models import PrivateMessage

        msg = await database_sync_to_async(
            lambda: PrivateMessage.objects
                .prefetch_related("files")
                .get(id=message_id)
        )()

        target_chat_open = await self.is_chat_open(target, self.user_id)

        if target_chat_open:
            await self.mark_delivered(msg.id)
            await self.mark_read_single(msg.id)

            msg = await database_sync_to_async(
                lambda: PrivateMessage.objects
                    .prefetch_related("files")
                    .get(id=msg.id)
            )()

        serialized = await self.serialize_message(msg)

        await self.channel_layer.group_send(
            f"chat_{target}",
            {"type": "chat_message", "message": serialized}
        )
        await self.mark_delivered(msg.id)

        await self.channel_layer.group_send(
            f"chat_{self.user_id}",
            {"type": "chat_message", "message": serialized}
        )

        await self.channel_layer.group_send(
            f"chat_{self.user_id}",
            {"type": "message_delivered", "message_id": msg.id}
        )

        if target_chat_open:
            await self.channel_layer.group_send(
                f"chat_{self.user_id}",
                {"type": "messages_read", "message_ids": [msg.id]}
            )

    # ==================================================
    # SEND MESSAGE
    # ==================================================
    async def handle_send_message(self, data):
        text = data["text"]
        target = int(data["target"])

        msg = await self.create_message(self.user_id, target, text)
        target_chat_open = await self.is_chat_open(target, self.user_id)

        if target_chat_open:
            await self.mark_delivered(msg.id)
            await self.mark_read_single(msg.id)

            from .models import PrivateMessage
            msg = await database_sync_to_async(
                lambda: PrivateMessage.objects
                    .prefetch_related("files")
                    .get(id=msg.id)
            )()

        serialized = await self.serialize_message(msg)

        await self.channel_layer.group_send(
            f"chat_{target}",
            {"type": "chat_message", "message": serialized}
        )

        await self.channel_layer.group_send(
            f"chat_{self.user_id}",
            {"type": "chat_message", "message": serialized}
        )

        if await self.is_user_online(target):
            await self.channel_layer.group_send(
                f"user_{target}",
                {"type": "message_delivered", "message_id": msg.id, "receiver_id": target}
            )

        if target_chat_open:
            await self.channel_layer.group_send(
                f"chat_{target}",
                {
                    "type": "messages_read",
                    "message_ids": [msg.id],
                    "reader_id": self.user_id
                }
            )

    # ==================================================
    # CHAT OPEN
    # ==================================================
    async def handle_chat_open(self, data):
        other_user_id = int(data["target"])
        print(f"🔥 CHAT OPEN: {self.user_id} -> {other_user_id}")

        await self.add_active_chat(self.user_id, other_user_id)

        message_ids = await self.mark_messages_read(
            reader_id=self.user_id,
            sender_id=other_user_id
        )

        if not message_ids:
            return

        payload = {
            "type": "messages_read",
            "message_ids": message_ids,
            "reader_id": self.user_id,
        }

        await self.channel_layer.group_send(f"chat_{other_user_id}", payload)
        await self.channel_layer.group_send(f"chat_{self.user_id}", payload)

    @database_sync_to_async
    def is_user_online(self, user_id: int):
        r = get_redis_connection("default")
        return r.sismember("online_users", user_id)

    # ==================================================
    # REDIS HELPERS
    # ==================================================
    @database_sync_to_async
    def add_active_chat(self, user_id: int, target_id: int):
        r = get_redis_connection("default")
        r.sadd(active_chat_key(user_id), target_id)
        r.expire(active_chat_key(user_id), 60 * 60)

    @database_sync_to_async
    def clear_active_chats(self, user_id: int):
        r = get_redis_connection("default")
        r.delete(active_chat_key(user_id))

    @database_sync_to_async
    def is_chat_open(self, user_id: int, target_id: int) -> bool:
        r = get_redis_connection("default")
        return r.sismember(active_chat_key(user_id), target_id)

    @database_sync_to_async
    def remove_active_chat(self, user_id: int, target_id: int):
        r = get_redis_connection("default")
        r.srem(active_chat_key(user_id), target_id)

    # ==================================================
    # DB HELPERS
    # ==================================================
    @database_sync_to_async
    def create_message(self, sender_id, target_id, text):
        from .models import PrivateMessage
        return PrivateMessage.objects.create(
            sender_id=sender_id,
            target_id=target_id,
            text=text,
            is_delivered=False,
            is_read=False
        )

    @database_sync_to_async
    def mark_delivered(self, message_id):
        from .models import PrivateMessage
        PrivateMessage.objects.filter(id=message_id).update(is_delivered=True)

    @database_sync_to_async
    def mark_read_single(self, message_id):
        from .models import PrivateMessage
        PrivateMessage.objects.filter(id=message_id).update(is_read=True)

    @database_sync_to_async
    def mark_messages_read(self, reader_id, sender_id):
        from .models import PrivateMessage
        qs = PrivateMessage.objects.filter(
            sender_id=sender_id,
            target_id=reader_id,
            is_read=False
        )
        ids = list(qs.values_list("id", flat=True))
        qs.update(is_read=True)
        return ids

    @database_sync_to_async
    def serialize_message(self, msg):
        print("files ", [(f.id, f.type) for f in msg.files.all()])
        return {
            "id": msg.id,
            "text": msg.text,
            "created_at": msg.created_at.isoformat(),
            "is_delivered": msg.is_delivered,
            "is_read": msg.is_read,
            "sender_id": msg.sender_id,
            "target_id": msg.target_id,
            "files": [
                {
                    "id": f.id,
                    "url": f.file.url,
                    "type": f.type,
                    "duration": f.duration,
                }
                for f in msg.files.all()
            ]
        }

    # ==================================================
    # WS OUT
    # ==================================================
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"]
        }))

    async def messages_read(self, event):
        await self.send(text_data=json.dumps({
            "type": "read",
            "message_ids": event["message_ids"]
        }))

    async def message_delivered(self, event):
        await self.send(text_data=json.dumps({
            "type": "delivered",
            "message_id": event["message_id"]
        }))

    async def chat_update_event(self, event):
        await self.send_json({
            "type": "chat_update",
            "chat": event["chat"]
        })

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({
            "type": "message_deleted",
            "message_id": event["message_id"]
        }))






from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

import uuid  # 🔥 1. Обязательно добавь этот импорт в самом верху файла!

@database_sync_to_async
def trigger_call_push(caller_id, target_id):
    User = get_user_model()
    from .utils import send_push_notification
    try:
        caller = User.objects.get(id=caller_id)
        target = User.objects.get(id=target_id)
        
        call_uuid = str(uuid.uuid4())
        
        # 🔥 ВЫЗЫВАЕМ БЕЗ title И body!
        send_push_notification(
            user=target,
            # Обычные текстовые уведомления (title, body) мы тут больше не пишем!
            data={
                "type": "incoming_call", 
                "caller_id": caller.id,
                "caller_name": caller.username,
                "uuid": call_uuid
            }
        )
    except Exception as e:
        print(f"Ошибка отправки пуша для звонка: {e}")

class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = int(self.scope["url_route"]["kwargs"]["user_id"])
        self.group_name = f"call_{self.user_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")
        target = data.get("target")

        if not msg_type or not target:
            return

        target = int(target)

        # Защита от эха (чтобы не звонить самому себе)
        if target == self.user_id:
            return

        # 🔥 1. ПУШ-УВЕДОМЛЕНИЯ ПРИ СТАРТЕ ЗВОНКА
        if msg_type == "offer":
            await trigger_call_push(self.user_id, target)

        # 🚀 2. ЛОГИКА "ОТВЕЧЕНО НА ДРУГОМ УСТРОЙСТВЕ"
        if msg_type == "answer":
            client_id = data.get("client_id")
            
            # Если телефон передал свой ID, рассылаем его всем НАШИМ устройствам
            if client_id:
                await self.channel_layer.group_send(
                    self.group_name, # Отправляем в СВОЮ группу
                    {
                        "type": "forward_call",
                        "data": {
                            "type": "answered_elsewhere",
                            "client_id": client_id
                        }
                    }
                )

        # 📡 3. СТАНДАРТНАЯ ПЕРЕСЫЛКА (offer, answer, ice-candidate, call-ended)
        # Отправляем собеседнику
        await self.channel_layer.group_send(
            f"call_{target}",
            {
                "type": "forward_call",
                "data": {
                    **data,
                    "from": self.user_id
                }
            }
        )

    async def forward_call(self, event):
        await self.send(text_data=json.dumps(event["data"]))


import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async





from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.files.base import ContentFile
from asgiref.sync import sync_to_async
import base64
import uuid













class GroupChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.group_name = f"group_{self.group_id}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
         # 👇 ЛИЧНАЯ группа пользователя (ВАЖНО)
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive_json(self, content):
        event_type = content.get("type")

        if event_type == "chat_open":
            await self.handle_chat_open()

        elif event_type == "messages_read":
            await self.handle_messages_read(content)



    async def handle_messages_read(self, data):
        message_ids = data.get("message_ids", [])

        if not message_ids:
            return

        await self.mark_messages_read_by_ids(
            message_ids=message_ids,
            user_id=self.user.id
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "messages_read_update",
                "message_ids": message_ids,
                "user": {
                    "id": self.user.id,
                    "username": self.user.username,
                },
            }
        )


    # ===============================
    async def handle_chat_open(self):
        message_ids = await self.mark_group_messages_read(
            group_id=self.group_id,
            user_id=self.user.id
        )

        if not message_ids:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "messages_read_update",
                "message_ids": message_ids,
                "user": {
                    "id": self.user.id,
                    "username": self.user.username,
                },
            }
        )

    @database_sync_to_async
    def mark_messages_read_by_ids(self, message_ids, user_id):
        from .models import GroupMessage

        qs = GroupMessage.objects.filter(
            id__in=message_ids
        ).exclude(read_by__id=user_id)

        for msg in qs:
            msg.read_by.add(user_id)



    # ===============================
    @database_sync_to_async
    def mark_group_messages_read(self, group_id, user_id):
        from .models import GroupMessage

        qs = GroupMessage.objects.filter(
            group_id=group_id
        ).exclude(sender_id=user_id).exclude(read_by__id=user_id)

        ids = list(qs.values_list("id", flat=True))

        for msg in qs:
            msg.read_by.add(user_id)

        return ids

    # ===============================
    async def messages_read_update(self, event):
        await self.send_json({
            "type": "messages.read_update",
            "message_ids": event["message_ids"],
            "user": event["user"],
        })

    async def reply_notification(self, event):
        await self.send_json(event["payload"])

    # ===============================
    async def group_message(self, event):
        await self.send_json({
            "type": "message",
            "message": event["message"]
        })

    async def group_message_deleted(self, event):
        await self.send_json({
            "type":"message.deleted",
            "message_id":event["message_id"]
        })

    
    async def chat_update_event(self, event):
        await self.send_json({
            "type": "chat_update",
            "chat": event["chat"]
        })



# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async





from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async



class ProductChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.product_id = self.scope["url_route"]["kwargs"]["product_id"]
        self.group_name = f"product_chat_{self.product_id}"

        if not self.scope["user"].is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # 🔥 при открытии соединения сразу помечаем все входящие сообщения от других как прочитанные
        await self.mark_all_messages_read_and_notify()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ===================== CLIENT → SERVER =====================
    async def receive_json(self, content):
        event_type = content.get("type")

        if event_type == "messages_read":
            await self.handle_messages_read(content)
            
        if event_type == "new_message":
            await self.new_message(self, content)

        elif event_type == "chat_open":
            sender_id = content.get("sender_id")
            if sender_id:
                await self.chat_open(sender_id)

    # ===================== GROUP → CLIENT =====================
    async def new_message(self, event):
        await self.send_json({
            "type": "new_message",
            "message": event["message"],
        })

    async def read_receipt(self, event):
        await self.send_json({
            "type": "messages_read",
            "sender_id": event["sender_id"],
            "receiver_id": event["receiver_id"],
            "product_id": event["product_id"],
            "updated": event["updated"],
        })

    async def product_message_delivered(self, event):
        await self.send_json({
            "type": "product_delivered",
            "message_id": event["message_id"],
            "product_id": event["product_id"],
            "receiver_id": event["receiver_id"],
        })

    # ===================== HANDLERS =====================
    async def handle_messages_read(self, content):
        sender_id = content.get("sender_id")
        if not sender_id:
            return

        updated = await self.mark_messages_read(sender_id)

        if updated > 0:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "read_receipt",
                    "sender_id": sender_id,
                    "receiver_id": self.scope["user"].id,
                    "product_id": self.product_id,
                    "updated": updated,
                }
            )

    async def chat_open(self, sender_id):
        # 1️⃣ помечаем доставленные
        message_ids = await self.mark_delivered(sender_id)
        for message_id in message_ids:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "product_message_delivered",
                    "message_id": message_id,
                    "product_id": self.product_id,
                    "receiver_id": self.scope["user"].id,
                }
            )

        # 2️⃣ помечаем прочитанные сразу
        updated = await self.mark_messages_read(sender_id)
        if updated > 0:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "read_receipt",
                    "sender_id": sender_id,
                    "receiver_id": self.scope["user"].id,
                    "product_id": self.product_id,
                    "updated": updated,
                }
            )

    # ===================== DB =====================
    @database_sync_to_async
    def mark_messages_read(self, sender_id):
        from .models import Message

        return Message.objects.filter(
            product_id=self.product_id,
            sender_id=sender_id,
            receiver=self.scope["user"],
            is_read=False
        ).update(is_read=True)

    @database_sync_to_async
    def mark_delivered(self, sender_id):
        from .models import Message

        qs = Message.objects.filter(
            product_id=self.product_id,
            sender_id=sender_id,
            receiver=self.scope["user"],
            is_delivered=False
        )
        ids = list(qs.values_list("id", flat=True))
        qs.update(is_delivered=True)
        return ids

    # 🔹 вспомогательный метод: при открытии WS помечаем все входящие как read
    async def mark_all_messages_read_and_notify(self):
        from .models import Message

        qs = await database_sync_to_async(lambda: list(
            Message.objects.filter(
                product_id=self.product_id,
                receiver=self.scope["user"],
                is_read=False
            )
        ))()

        if not qs:
            return

        ids = [m.id for m in qs]

        # обновляем is_read
        await database_sync_to_async(
            lambda: Message.objects.filter(id__in=ids).update(is_read=True)
        )()

        # уведомляем всех участников чата
        sender_ids = set(m.sender_id for m in qs)
        for sender_id in sender_ids:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "read_receipt",
                    "sender_id": sender_id,
                    "receiver_id": self.scope["user"].id,
                    "product_id": self.product_id,
                    "updated": len([m for m in qs if m.sender_id == sender_id]),
                }
            )






# consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model


class RegionChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.region_id = self.scope["url_route"]["kwargs"]["region_id"]
        self.group_name = f"region_{self.region_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        msg_type = content.get("type")

        if msg_type == "mark_read":
            await self.mark_read()

    # ======================
    # NOTIFY: NEW MESSAGE
    # ======================
   # ======================================================
    async def new_message_notify(self, event):
        # В event["message"] теперь лежит результат работы сериализатора из View
        await self.send_json({
            "type": "new_message",
            "message": event["message"],  # Это объект со всеми полями (text, user, created_at)
        })

    # ======================
    # READ
    # ======================
    async def mark_read(self):
        await self.mark_region_read()

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "messages_read",
                "user_id": self.user.id
            }
        )

    async def messages_read(self, event):
        await self.send_json({
            "type": "messages_read",
            "user_id": event["user_id"]
        })

    # ======================
    # DB
    # ======================
    @database_sync_to_async
    def mark_region_read(self):
        from .models import MessageRegionChat
        MessageRegionChat.objects.filter(
            region_id=self.region_id,
            is_read=False
        ).exclude(user=self.user).update(is_read=True)

    #Удаления сообщения
    # ======================
    async def delete_message_notify(self, event):
        """Отправляет клиенту сигнал об удалении сообщения"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))