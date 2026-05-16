import os
from django.conf import settings
from django.db.models import Q, Count
from django.utils import timezone
from .models import PrivateMessage, Message, GroupMessage, Group




# 1. Сначала определяем вспомогательные функции, чтобы они были доступны ниже
def get_full_url(path):
    """Формирует полный URL для медиа-файлов"""
    if not path:
        return None
    if str(path).startswith('http'):
        return path
    
    # Исправляем получение домена
    domain = getattr(settings, 'BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')
    # Убеждаемся, что путь начинается с /
    str_path = str(path)
    if not str_path.startswith('/'):
        str_path = f"/{str_path}"
        
    return f"{domain}{str_path}"


def format_last_message(msg):
    if not msg:
        return None
    
    # 1. Если есть текст — приоритет тексту
    if hasattr(msg, 'text') and msg.text and msg.text.strip():
        return msg.text
    
    # 2. ПРЯМОЙ запрос к базе (без prefetch), чтобы поймать только что созданный файл
    first_file = msg.files.all().first()
    print('first_file', first_file)
    
    if first_file:
        f_type = getattr(first_file, 'type', None)
        if f_type == "audio":
            return "🎤 Голосовое сообщение"
        elif f_type == "image":
            return "📷 Фотография"
        elif f_type == "video":
            return "🎥 Видео"
        else:
            return "📎 Файл"
            
    # return "Сообщение"


# В get_single_chat_summary добавь prefetch_related, чтобы не было 100500 запросов к БД
def get_single_chat_summary(user, chat_type, companion_id=None, product_id=None, group_id=None):
    try:
        if chat_type == "private":
            msg = PrivateMessage.objects.filter(
                (Q(sender=user, target_id=companion_id) | Q(sender_id=companion_id, target=user))
            ).order_by("-created_at")\
             .select_related("sender", "target")\
             .prefetch_related("files")\
             .first() # Добавили prefetch_related для файлов

            if not msg: return None
            
            companion = msg.target if msg.sender == user else msg.sender
            unread = PrivateMessage.objects.filter(
                sender_id=companion_id, 
                target=user, 
                is_read=False
            ).count()

            avatar_path = companion.avatar.url if companion.avatar else None

            return {
                "id": f"private_{companion.id}",
                "type": "private",
                "user_id": companion.id,
                "title": companion.username,
                "avatar": get_full_url(avatar_path),
                "last_message": format_last_message(msg),
                "last_message_at": msg.created_at.isoformat(),
                "unread_count": unread,
                "link": f"/chat/private/{companion.id}",
            }

        # --- ЛОГИКА ДЛЯ ТОВАРОВ (Исправлено здесь) ---
        
        # --- ЛОГИКА ДЛЯ ТОВАРОВ (Исправлено здесь) ---
        if chat_type == "product":
            msg = Message.objects.filter(
                product_id=product_id
            ).filter(
                Q(sender=user, receiver_id=companion_id) | Q(sender_id=companion_id, receiver=user)
            ).select_related("product", "sender", "receiver")\
            .prefetch_related("files")\
            .order_by("-created_at").first()

            if not msg: 
                return None

            unread = Message.objects.filter(
                product_id=product_id, 
                sender_id=companion_id, 
                receiver=user, 
                is_read=False
            ).count()

            img_url = None
            if msg.product and msg.product.main_image_webp:
                img_url = msg.product.main_image_webp.url

            return {
                # 🔥 ВАЖНО: ID должен быть уникальным для ПАРЫ товар + собеседник, 
                # а не для конкретного сообщения!
                "id": f"product_{product_id}_{companion_id}", 
                "type": "product",
                "product_id": product_id,
                "companion_id": companion_id,
                "title": msg.product.productName if msg.product else "Товар",
                "avatar": get_full_url(img_url),
                "last_message": format_last_message(msg),
                "last_message_at": msg.created_at.isoformat(),
                "unread_count": unread,
                "link": f"/chat/product/{product_id}/{companion_id}",
            }




        elif chat_type == "group":
            g = Group.objects.get(id=group_id)
            last_msg = GroupMessage.objects.filter(group=g)\
                .order_by("-created_at")\
                .prefetch_related("files")\
                .first()
            
            if not last_msg: return None

            unread = GroupMessage.objects.filter(group=g).exclude(sender=user).exclude(read_by=user).count()
            group_avatar = g.avatar.url if g.avatar else None

            return {
                "id": f"{g.id}",
                "type": "group",
                "title": g.title,
                "avatar": get_full_url(group_avatar),
                "last_message": format_last_message(last_msg),
                "last_message_at": last_msg.created_at.isoformat(),
                "unread_count": unread,
                "link": f"/groups/{g.id}/chat",
            }

        # Логика для chat_type == "product" аналогично через .prefetch_related("files")

    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return None