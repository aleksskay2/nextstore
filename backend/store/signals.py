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
    Story
)

# 🔥 ДОБАВЬТЕ ИМПОРТ МОДЕЛИ КОНТАКТОВ
from .models import UserContact 

channel_layer = get_channel_layer()

# =========================================================
# УМНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ ИМЕНИ ДЛЯ ПУША
# =========================================================
def get_display_name(sender, receiver_user):
    """
    Ищет, как `receiver_user` записал `sender` в своей телефонной книге.
    Если контакта нет, возвращает username.
    """
    contact = UserContact.objects.filter(owner=receiver_user, contact_user=sender).first()
    if contact and contact.local_name:
        return contact.local_name
    return sender.username

# =========================================================
# БЕЗОПАСНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =========================================================
def get_notification_text_for_file(instance):
    file_type = getattr(instance, 'type', 'file')
    if file_type == 'image': return "📷 Отправил фотографию"
    if file_type == 'video': return "📹 Отправил видео"
    if file_type == 'audio': return "🎤 Голосовое сообщение"
    
    filename = instance.file.name if instance.file else ""
    ext = os.path.splitext(str(filename).split('?')[0])[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']: return "📷 Отправил фотографию"
    elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']: return "📹 Отправил видео"
    elif ext in ['.mp3', '.wav', '.ogg', '.m4a', '.aac']: return "🎤 Голосовое сообщение"
    return "📎 Вам отправили файл"

def broadcast_chat_update(user_id, chat_data):
    if chat_data:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {"type": "chat_update_event", "chat": chat_data}
        )

def has_text_content(instance):
    text = getattr(instance, 'text', None)
    return bool(text and str(text).strip())

def get_sender_safely(instance):
    return getattr(instance, 'sender', getattr(instance, 'author', None))


# =========================================================
# 1️⃣ ПРИВАТНЫЕ ЧАТЫ
# =========================================================
@receiver(post_save, sender=PrivateMessage)
def send_private_chat_update(sender, instance, created, **kwargs):
    if not created or not has_text_content(instance): return 

    broadcast_chat_update(instance.sender_id, get_single_chat_summary(instance.sender, "private", companion_id=instance.target_id))
    broadcast_chat_update(instance.target_id, get_single_chat_summary(instance.target, "private", companion_id=instance.sender_id))

    # 🔥 ПОДМЕНА ИМЕНИ
    display_name = get_display_name(instance.sender, instance.target)

    send_push_notification(
        user=instance.target,
        title=f"Сообщение от {display_name}",
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
        broadcast_chat_update(sender_user.id, get_single_chat_summary(sender_user, "private", companion_id=message.target_id))
        broadcast_chat_update(message.target_id, get_single_chat_summary(message.target, "private", companion_id=sender_user.id))
        
        if not has_text_content(message):
            body_text = get_notification_text_for_file(instance) 
            
            # 🔥 ПОДМЕНА ИМЕНИ
            display_name = get_display_name(sender_user, message.target)

            send_push_notification(
                user=message.target,
                title=f"Сообщение от {display_name}",
                body=body_text,
                data={"type": "private_chat", "chat_id": sender_user.id}
            )
    transaction.on_commit(notify)


# =========================================================
# 2️⃣ ЧАТЫ ПО ТОВАРАМ
# =========================================================
@receiver(post_save, sender=Message)
def send_product_chat_update(sender, instance, created, **kwargs):
    if not created or not has_text_content(instance): return

    broadcast_chat_update(instance.sender_id, get_single_chat_summary(instance.sender, "product", companion_id=instance.receiver_id, product_id=instance.product_id))
    broadcast_chat_update(instance.receiver_id, get_single_chat_summary(instance.receiver, "product", companion_id=instance.sender_id, product_id=instance.product_id))

    # 🔥 ПОДМЕНА ИМЕНИ
    display_name = get_display_name(instance.sender, instance.receiver)

    send_push_notification(
        user=instance.receiver,
        title=f"Вопрос по товару {instance.product.productName} от {display_name}",
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
            body_text = get_notification_text_for_file(instance)
            
            # 🔥 ПОДМЕНА ИМЕНИ
            display_name = get_display_name(sender_obj, message.receiver)

            send_push_notification(
                user=message.receiver,
                title=f"Вопрос по товару от {display_name}",
                body=body_text,
                data={"type": "product_chat", "product_id": message.product_id}
            )
    transaction.on_commit(notify)


# =========================================================
# 3️⃣ ГРУППОВЫЕ ЧАТЫ
# =========================================================
@receiver(post_save, sender=GroupMessage)
def send_group_chat_update(sender, instance, created, **kwargs):
    if not created or not has_text_content(instance): return

    group = instance.group
    sender_obj = get_sender_safely(instance)
    group_title = getattr(group, 'title', getattr(group, 'name', 'Группа'))

    for member in group.members.all():
        broadcast_chat_update(member.user_id, get_single_chat_summary(member.user, "group", group_id=group.id))
        
        if member.user != sender_obj:
            # 🔥 ПОДМЕНА ИМЕНИ ДЛЯ КАЖДОГО УЧАСТНИКА ГРУППЫ ОТДЕЛЬНО
            display_name = get_display_name(sender_obj, member.user)

            send_push_notification(
                user=member.user,
                title=f"Группа: {group_title}",
                body=f"{display_name}: {instance.text}",
                data={"type": "group_chat", "group_id": group.id}
            )

@receiver(post_save, sender=GroupMessageFile)
def send_group_file_chat_update(sender, instance, created, **kwargs):
    if not created: return
    message = instance.message
    group = message.group
    sender_user = get_sender_safely(message)
    if not sender_user: return
    
    group_title = getattr(group, 'title', getattr(group, 'name', 'Группа'))

    def notify():
        file_text = get_notification_text_for_file(instance)
        
        for member in group.members.all():
            broadcast_chat_update(member.user_id, get_single_chat_summary(member.user, "group", group_id=group.id))
            
            if not has_text_content(message) and member.user != sender_user:
                # 🔥 ПОДМЕНА ИМЕНИ
                display_name = get_display_name(sender_user, member.user)
                body_text = f"{display_name}: {file_text}"

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




import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import PrivateMessageFile, GroupMessageFile, MessageFile, Story

def safe_delete_file(file_field):
    """Безопасное физическое удаление файла с диска"""
    if file_field and hasattr(file_field, 'path'):
        try:
            if os.path.isfile(file_field.path):
                os.remove(file_field.path)
        except Exception as e:
            print(f"⚠️ Ошибка удаления файла {file_field.path}: {e}")

# 1. Удаление файлов личных сообщений (файл + превью)
@receiver(post_delete, sender=PrivateMessageFile)
def delete_private_message_files(sender, instance, **kwargs):
    safe_delete_file(instance.file)
    safe_delete_file(instance.thumbnail)

# 2. Удаление файлов групповых сообщений (файл + превью)
@receiver(post_delete, sender=GroupMessageFile)
def delete_group_message_files(sender, instance, **kwargs):
    safe_delete_file(instance.file)
    safe_delete_file(instance.thumbnail)

# 3. Удаление файлов сообщений по товарам (файл + превью)
@receiver(post_delete, sender=MessageFile)
def delete_product_message_files(sender, instance, **kwargs):
    safe_delete_file(instance.file)
    safe_delete_file(instance.thumbnail)

# 4. Удаление медиафайлов историй (Stories)
@receiver(post_delete, sender=Story)
def delete_story_media(sender, instance, **kwargs):
    safe_delete_file(instance.media)