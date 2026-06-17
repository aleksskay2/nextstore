# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import PrivateMessageFile
from django.db import transaction

from .utils import send_push_notification  

from .models import PrivateMessage, Message, GroupMessage, Group
from .services import get_single_chat_summary
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    PrivateMessage,
    PrivateMessageFile,
    Message,
    MessageFile,
    GroupMessage,
    GroupMessageFile,
)
from .services import get_single_chat_summary

channel_layer = get_channel_layer()


# def broadcast_chat_update(user_id, chat_data):
#     if chat_data:
#         async_to_sync(channel_layer.group_send)(
#             f"user_{user_id}",
#             {
#                 "type": "chat_update_event",
#                 "chat": chat_data
#             }
#         )

# # # =========================================================
# # # 1️⃣ ПРИВАТНЫЕ ЧАТЫ
# # # =========================================================

# @receiver(post_save, sender=PrivateMessage)
# def send_private_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     # ❗ ВАЖНО: если это сообщение БЕЗ текста — значит будет файл
#     if not instance.text:
#         return

#     broadcast_chat_update(
#         instance.sender_id,
#         get_single_chat_summary(
#             instance.sender,
#             "private",
#             companion_id=instance.target_id
#         )
#     )

#     broadcast_chat_update(
#         instance.target_id,
#         get_single_chat_summary(
#             instance.target,
#             "private",
#             companion_id=instance.sender_id
#         )
#     )

#      # Push
#     send_push_notification(
#         user=instance.target,
#         title=f"Сообщение от {instance.sender.username}",
#         body=instance.text,
#         data={"type": "private_chat", "chat_id": instance.sender_id}
#     )


# # @receiver(post_save, sender=PrivateMessageFile)
# # def send_private_file_chat_update(sender, instance, created, **kwargs):
# #     if not created:
# #         return

# #     message = instance.message

# #     def notify():
# #         broadcast_chat_update(
# #             message.sender_id,
# #             get_single_chat_summary(
# #                 message.sender,
# #                 "private",
# #                 companion_id=message.target_id
# #             )
# #         )

# #         broadcast_chat_update(
# #             message.target_id,
# #             get_single_chat_summary(
# #                 message.target,
# #                 "private",
# #                 companion_id=message.sender_id
# #             )
# #         )

# #     transaction.on_commit(notify)



# @receiver(post_save, sender=PrivateMessageFile)
# def send_private_file_chat_update(sender, instance, created, **kwargs):
#     if not created: return
#     message = instance.message
    
#     def notify():

#         broadcast_chat_update(
#             message.sender_id,
#             get_single_chat_summary(
#                 message.sender,
#                 "private",
#                 companion_id=message.target_id
#             )
#         )

#         broadcast_chat_update(
#             message.target_id,
#             get_single_chat_summary(
#                 message.target,
#                 "private",
#                 companion_id=message.sender_id
#             )
#         )
#         # Если в сообщении НЕ БЫЛО текста, отправляем пуш о файле.
#         # (если текст был, пуш уже ушел из сигнала PrivateMessage, чтобы не спамить двумя пушами)
#         if not message.text:
#             # ВАЖНО: Предполагается, что поле с файлом в модели называется 'file'
#             # Если оно называется 'image' или как-то иначе, поменяй instance.file.name на свое
#             body_text = get_notification_text_for_file(instance.file.name)
            
#             send_push_notification(
#                 user=message.target,
#                 title=f"Сообщение от {message.sender.username}",
#                 body=body_text,
#                 data={"type": "private_chat", "chat_id": message.sender_id}
#             )

#     transaction.on_commit(notify)





# # # =========================================================
# # # 2️⃣ ЧАТЫ ПО ТОВАРАМ (Message / MessageFile)
# # # =========================================================

# @receiver(post_save, sender=Message)
# def send_product_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     # Отправителю
#     broadcast_chat_update(
#         instance.sender_id,
#         get_single_chat_summary(
#             instance.sender,
#             "product",
#             companion_id=instance.receiver_id,
#             product_id=instance.product_id
#         )
#     )

#     # Получателю
#     broadcast_chat_update(
#         instance.receiver_id,
#         get_single_chat_summary(
#             instance.receiver,
#             "product",
#             companion_id=instance.sender_id,
#             product_id=instance.product_id
#         )
#     )


# @receiver(post_save, sender=MessageFile)
# def send_product_file_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     message = instance.message

#     def notify():
#         # Отправителю
#         broadcast_chat_update(
#             message.sender_id,
#             get_single_chat_summary(
#                 message.sender,
#                 "product",
#                 companion_id=message.receiver_id,
#                 product_id=message.product_id
#             )
#         )

#         # Получателю
#         broadcast_chat_update(
#             message.receiver_id,
#             get_single_chat_summary(
#                 message.receiver,
#                 "product",
#                 companion_id=message.sender_id,
#                 product_id=message.product_id
#             )
#         )

#     transaction.on_commit(notify)

# # # =========================================================
# # # 3️⃣ ГРУППОВЫЕ ЧАТЫ (GroupMessage / GroupMessageFile)
# # # =========================================================

# @receiver(post_save, sender=GroupMessage)
# def send_group_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     group = instance.group

#     for member in group.members.all():
#         broadcast_chat_update(
#             member.user_id,
#             get_single_chat_summary(
#                 member.user,
#                 "group",
#                 group_id=group.id
#             )
#         )


# @receiver(post_save, sender=GroupMessageFile)
# def send_group_file_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     message = instance.message
#     group = message.group

#     def notify():
#         for member in group.members.all():
#             broadcast_chat_update(
#                 member.user_id,
#                 get_single_chat_summary(
#                     member.user,
#                     "group",
#                     group_id=group.id
#                 )
#             )

#     transaction.on_commit(notify)








# # для уведомлений
# from .utils import send_push_notification


# @receiver(post_save, sender=PrivateMessage)
# def send_private_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     # 1. Ваш старый код для Websockets (для тех, кто онлайн)
#     broadcast_chat_update(...)

#     # 2. НОВЫЙ код для Push (для тех, кто оффлайн)
#     send_push_notification(
#         user=instance.target,  # Получатель
#         title=f"Новое сообщение от {instance.sender.username}",
#         body=instance.text if hasattr(instance, 'text') else "Вам отправили файл",
#         data={"type": "private_chat", "chat_id": instance.sender_id}
#     )

# @receiver(post_save, sender=GroupMessage)
# def send_group_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     group = instance.group
#     # Рассылаем всем участникам группы, кроме отправителя
#     for member in group.members.exclude(user=instance.author):
#         send_push_notification(
#             user=member.user,
#             title=f"Группа: {group.name}",
#             body=f"{instance.author.username}: {instance.text}",
#             data={"type": "group_chat", "group_id": group.id}
#         )








# import os

# def get_notification_text_for_file(filename):
#     """Определяет текст уведомления на основе расширения файла"""
#     if not filename:
#         return "📎 Вам отправили файл"
    
#     ext = os.path.splitext(str(filename))[1].lower()
    
#     # Фотографии
#     if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
#         return "📷 Вам отправили фотографию"
#     # Видео
#     elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
#         return "📹 Вам прислали видео"
#     # Голосовые
#     elif ext in ['.mp3', '.wav', '.ogg', '.m4a']:
#         return "🎤 Голосовое сообщение"
    
#     # Все остальное (pdf, docx и т.д.)
#     return "📎 Вам отправили файл"




# def broadcast_chat_update(user_id, chat_data):
#     """Отправка обновления через Websockets"""
#     if chat_data:
#         print(f"📡 [WS] Отправка обновления сокета для user_id: {user_id}")
#         async_to_sync(channel_layer.group_send)(
#             f"user_{user_id}",
#             {
#                 "type": "chat_update_event",
#                 "chat": chat_data
#             }
#         )

# # =========================================================
# # 1️⃣ ПРИВАТНЫЕ ЧАТЫ
# # =========================================================



# # =========================================================
# # 1️⃣ ПРИВАТНЫЕ ЧАТЫ
# # =========================================================

# # @receiver(post_save, sender=PrivateMessage)
# # def send_private_chat_update(sender, instance, created, **kwargs):
# #     if not created:
# #         return
    
# #     # --- 1. Websockets ---
# #     broadcast_chat_update(
# #         instance.sender_id,
# #         get_single_chat_summary(instance.sender, "private", companion_id=instance.target_id)
# #     )
# #     broadcast_chat_update(
# #         instance.target_id,
# #         get_single_chat_summary(instance.target, "private", companion_id=instance.sender_id)
# #     )

# #     # --- 2. Push-уведомление (Отправляем здесь ТОЛЬКО если есть текст) ---
# #     if instance.text:
# #         send_push_notification(
# #             user=instance.target,
# #             title=f"Сообщение от {instance.sender.username}",
# #             body=instance.text,
# #             data={"type": "private_chat", "chat_id": instance.sender_id}
# #         )

# # @receiver(post_save, sender=PrivateMessageFile)
# # def send_private_file_chat_update(sender, instance, created, **kwargs):
# #     if not created: return
# #     message = instance.message
    
# #     def notify():
# #         # Если в сообщении НЕ БЫЛО текста, отправляем пуш о файле.
# #         # (если текст был, пуш уже ушел из сигнала PrivateMessage, чтобы не спамить двумя пушами)
# #         if not message.text:
# #             # ВАЖНО: Предполагается, что поле с файлом в модели называется 'file'
# #             # Если оно называется 'image' или как-то иначе, поменяй instance.file.name на свое
# #             body_text = get_notification_text_for_file(instance.file.name)
            
# #             send_push_notification(
# #                 user=message.target,
# #                 title=f"Сообщение от {message.sender.username}",
# #                 body=body_text,
# #                 data={"type": "private_chat", "chat_id": message.sender_id}
# #             )

# #     transaction.on_commit(notify)


# # =========================================================
# # 2️⃣ ЧАТЫ ПО ТОВАРАМ
# # =========================================================

# @receiver(post_save, sender=Message)
# def send_product_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return
    
#     print(f"📦 [Signal] Новое сообщение по товару от {instance.sender.username}")

#     # Websockets
#     broadcast_chat_update(instance.sender_id, get_single_chat_summary(instance.sender, "product", companion_id=instance.receiver_id, product_id=instance.product_id))
#     broadcast_chat_update(instance.receiver_id, get_single_chat_summary(instance.receiver, "product", companion_id=instance.sender_id, product_id=instance.product_id))

#     # Push Получателю
#     send_push_notification(
#         user=instance.receiver,
#         title=f"Вопрос по товару от {instance.sender.username}",
#         body=instance.text,
#         data={"type": "product_chat", "product_id": instance.product_id}
#     )

# # =========================================================
# # 3️⃣ ГРУППОВЫЕ ЧАТЫ
# # =========================================================

# @receiver(post_save, sender=GroupMessage)
# def send_group_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     group = instance.group
#     author = instance.author

#     for member in group.members.all():
#         # Websockets (Всем участникам)
#         broadcast_chat_update(
#             member.user_id,
#             get_single_chat_summary(member.user, "group", group_id=group.id)
#         )
        
#         # Push (Всем, кроме автора сообщения)
#         if member.user != author:
#             send_push_notification(
#                 user=member.user,
#                 title=f"Группа: {group.name}",
#                 body=f"{author.username}: {instance.text}",
#                 data={"type": "group_chat", "group_id": group.id}
#             )







import os



from .utils import send_push_notification

channel_layer = get_channel_layer()

# =========================================================
# БЕЗОПАСНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =========================================================

def get_notification_text_for_file(instance):
    """Определяет текст уведомления на основе поля type и расширения"""
    # 1. Сначала доверяем полю 'type' из твоей модели
    file_type = getattr(instance, 'type', 'file')
    
    if file_type == 'image':
        return "📷Отправил фотографию"
    if file_type == 'video':
        return "📹 Отправил видео"
    if file_type == 'audio':
        return "🎤 Голосовое сообщение"
    
    # 2. Если тип 'file', но мы хотим подстраховаться по расширению
    filename = instance.file.name if instance.file else ""
    clean_filename = str(filename).split('?')[0]
    ext = os.path.splitext(clean_filename)[1].lower()
    
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        return "📷 Отправил фотографию"
    elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']:
        # Если в базе это просто file, но расширение видео — пишем видео
        return "📹 Отправил видео"
    elif ext in ['.mp3', '.wav', '.ogg', '.m4a', '.aac']:
        return "🎤 Голосовое сообщение"
    
    return "📎 Вам отправили файл"


def broadcast_chat_update(user_id, chat_data):
    """Отправка обновления через Websockets"""
    if chat_data:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                "type": "chat_update_event",
                "chat": chat_data
            }
        )

def has_text_content(instance):
    """Безопасная проверка наличия текста"""
    text = getattr(instance, 'text', None)
    return bool(text and str(text).strip())

def get_file_name_safely(instance):
    """Безопасное получение имени файла"""
    if hasattr(instance, 'file') and instance.file:
        return instance.file.name
    return ""

def get_sender_safely(instance):
    """
    Безопасно достает отправителя. 
    Проверяет 'sender', потом 'author' (на случай если в моделях всё же чехарда)
    """
    return getattr(instance, 'sender', getattr(instance, 'author', None))

# =========================================================
# 1️⃣ ПРИВАТНЫЕ ЧАТЫ
# =========================================================

@receiver(post_save, sender=PrivateMessage)
def send_private_chat_update(sender, instance, created, **kwargs):
    if not created: return
    if not has_text_content(instance): return 

    broadcast_chat_update(instance.sender_id, get_single_chat_summary(instance.sender, "private", companion_id=instance.target_id))
    broadcast_chat_update(instance.target_id, get_single_chat_summary(instance.target, "private", companion_id=instance.sender_id))

    send_push_notification(
        user=instance.target,
        title=f"Сообщение от {instance.sender.username}",
        body=instance.text,
        data={"type": "private_chat", "chat_id": instance.sender_id}
    )

@receiver(post_save, sender=PrivateMessageFile)
def send_private_file_chat_update(sender, instance, created, **kwargs):
    if not created: return
    
    message = instance.message
    sender_user = get_sender_safely(message)
    if not sender_user: return

    def notify():
        # Обновляем списки чатов через сокеты
        broadcast_chat_update(sender_user.id, get_single_chat_summary(sender_user, "private", companion_id=message.target_id))
        broadcast_chat_update(message.target_id, get_single_chat_summary(message.target, "private", companion_id=sender_user.id))
        
        # Если у самого сообщения нет текста, отправляем пуш о файле
        if not has_text_content(message):
            # Передаем весь instance, чтобы функция видела поле .type
            body_text = get_notification_text_for_file(instance) 
            
            send_push_notification(
                user=message.target,
                title=f"Сообщение от {sender_user.username}",
                body=body_text,
                data={"type": "private_chat", "chat_id": sender_user.id}
            )
    
    # transaction.on_commit важен, чтобы дождаться сохранения файла на диске/в базе
    transaction.on_commit(notify)
# =========================================================
# 2️⃣ ЧАТЫ ПО ТОВАРАМ
# =========================================================

@receiver(post_save, sender=Message)
def send_product_chat_update(sender, instance, created, **kwargs):
    if not created: return
    if not has_text_content(instance): return

    broadcast_chat_update(instance.sender_id, get_single_chat_summary(instance.sender, "product", companion_id=instance.receiver_id, product_id=instance.product_id))
    broadcast_chat_update(instance.receiver_id, get_single_chat_summary(instance.receiver, "product", companion_id=instance.sender_id, product_id=instance.product_id))

    send_push_notification(
        user=instance.receiver,
        title=f"Вопрос по товару { instance.product.productName} от {instance.sender.username}",
        body=instance.text,
        data={"type": "product_chat", "product_id": instance.product_id}
    )



@receiver(post_save, sender=MessageFile)
def send_product_file_chat_update(sender, instance, created, **kwargs):
    if not created: return
    message = instance.message
    sender_obj = get_sender_safely(message)

    def notify():
        broadcast_chat_update(sender_obj.id, get_single_chat_summary(sender_obj, "product", companion_id=message.receiver_id, product_id=message.product_id))
        broadcast_chat_update(message.receiver_id, get_single_chat_summary(message.receiver, "product", companion_id=sender_obj.id, product_id=message.product_id))

        if not has_text_content(message):
            # ✅ ИСПРАВЛЕНО: Передаем сам instance, как и в других сигналах
            body_text = get_notification_text_for_file(instance)
            
            send_push_notification(
                user=message.receiver,
                title=f"Вопрос по товару от {sender_obj.username}",
                body=body_text,
                data={"type": "product_chat", "product_id": message.product_id}
            )
    transaction.on_commit(notify)


# =========================================================
# 3️⃣ ГРУППОВЫЕ ЧАТЫ
# =========================================================

@receiver(post_save, sender=GroupMessage)
def send_group_chat_update(sender, instance, created, **kwargs):
    if not created: return
    if not has_text_content(instance): return

    group = instance.group
    sender_obj = get_sender_safely(instance)
    group_title = getattr(group, 'title', getattr(group, 'name', 'Группа'))

    for member in group.members.all():
        broadcast_chat_update(member.user_id, get_single_chat_summary(member.user, "group", group_id=group.id))
        
        if member.user != sender_obj:
            send_push_notification(
                user=member.user,
                title=f"Группа: {group_title}",
                body=f"{sender_obj.username}: {instance.text}",
                data={"type": "group_chat", "group_id": group.id}
            )

@receiver(post_save, sender=GroupMessageFile)
def send_group_file_chat_update(sender, instance, created, **kwargs):
    if not created: return
    
    message = instance.message
    group = message.group
    sender_user = get_sender_safely(message) # Здесь будет твой fix для author
    if not sender_user: return
    
    group_title = getattr(group, 'title', getattr(group, 'name', 'Группа'))

    def notify():
        file_text = get_notification_text_for_file(instance)
        body_text = f"{sender_user.username}: {file_text}"
        
        for member in group.members.all():
            broadcast_chat_update(member.user_id, get_single_chat_summary(member.user, "group", group_id=group.id))
            
            if not has_text_content(message) and member.user != sender_user:
                send_push_notification(
                    user=member.user,
                    title=f"Группа: {group_title}",
                    body=body_text,
                    data={"type": "group_chat", "group_id": group.id}
                )
    
    transaction.on_commit(notify)




# # =========================================================
# # 2️⃣ ЧАТЫ ПО ТОВАРАМ
# # =========================================================

# @receiver(post_save, sender=Message)
# def send_product_chat_update(sender, instance, created, **kwargs):
#     if not created:
#         return

#     # Определяем участников
#     sender_user = instance.sender
#     receiver_user = instance.receiver
    
#     print(f"📦 [Signal] Новое сообщение по товару {instance.product_id} от {sender_user.username}")

#     def notify():
#         # 1. ОБНОВЛЕНИЕ ЧАТОВ (Websockets)
#         # Обновляем сводку чата для обоих участников
#         broadcast_chat_update(
#             sender_user.id, 
#             get_single_chat_summary(
#                 sender_user, "product", 
#                 companion_id=receiver_user.id, 
#                 product_id=instance.product_id
#             )
#         )
#         broadcast_chat_update(
#             receiver_user.id, 
#             get_single_chat_summary(
#                 receiver_user, "product", 
#                 companion_id=sender_user.id, 
#                 product_id=instance.product_id
#             )
#         )

#         # 2. ПОДГОТОВКА ТЕКСТА PUSH
#         body_text = instance.text
        
#         # Если текста нет (например, отправлен только файл)
#         if not body_text:
#             # Пытаемся взять первый файл, если у модели Message есть связь files
#             first_file = getattr(instance, 'files', None)
#             if first_file and first_file.exists():
#                 # Используем нашу общую функцию для определения типа (📷, 📹, 🎤)
#                 body_text = get_notification_text_for_file(first_file.first())
#             else:
#                 body_text = "📎 Вложение"

#         # 3. ОТПРАВКА PUSH
#         send_push_notification(
#             user=receiver_user,
#             title=f"Вопрос по товару от {sender_user.username}",
#             body=body_text,
#             data={
#                 "type": "product_chat", 
#                 "product_id": str(instance.product_id),
#                 "sender_id": str(sender_user.id)
#             }
#         )

#     # Ждем завершения транзакции, чтобы данные и файлы были доступны в БД
#     transaction.on_commit(notify)