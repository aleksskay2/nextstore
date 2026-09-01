import os
from django.conf import settings
from django.db.models import Q, Count
from django.utils import timezone
from .models import PrivateMessage, Message, GroupMessage, Group
from urllib.parse import urlparse



# 1. Сначала определяем вспомогательные функции, чтобы они были доступны ниже
# def get_full_url(path):
#     """Формирует полный URL для медиа-файлов"""
#     if not path:
#         return None
#     if str(path).startswith('http'):
#         return path
    
#     # Исправляем получение домена
#     domain = getattr(settings, 'BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')
#     # Убеждаемся, что путь начинается с /
#     str_path = str(path)
#     if not str_path.startswith('/'):
#         str_path = f"/{str_path}"
        
#     return f"{domain}{str_path}"


# 1. Сначала определяем вспомогательные функции, чтобы они были доступны ниже
def get_full_url(path):
    """
    Формирует ЧИСТЫЙ относительный URL.
    Вырезает любые старые локальные IP-адреса, чтобы фронтенд сам решал, какой домен подставить.
    """
    if not path:
        return None
        
    str_path = str(path)
    
    # Если путь содержит домен (начинается с http)
    if str_path.startswith('http'):
        parsed = urlparse(str_path)
        hostname = str(parsed.hostname)
        
        # Если это наши старые локальные адреса или текущий сервер - оставляем только путь (/media/...)
        if hostname in ['127.0.0.1', 'localhost'] or hostname.startswith('10.') or hostname.startswith('192.168.') or 'onrender.com' in hostname:
            str_path = parsed.path
        else:
            # Если это чужая внешняя ссылка (например, юзер зашел через Google/VK), отдаем как есть
            return str_path

    # Убеждаемся, что путь начинается с '/'
    if not str_path.startswith('/'):
        str_path = f"/{str_path}"
        
    return str_path
def format_last_message(msg, current_user=None):
    if not msg:
        return None
    
    # 🔥 1. ПРОВЕРКА НА ЗВОНОК
    if getattr(msg, "message_type", None) == "call":
        # Определяем, входящий или исходящий, если передан пользователь
        is_incoming = msg.target_id == current_user.id if current_user else False

        if msg.call_status == "missed":
            return "📞 Пропущенный звонок" if is_incoming else "📞 Отмененный звонок"
       
        else:
            duration = getattr(msg, "call_duration", 0) or 0
            if duration > 0:
                m, sec = divmod(duration, 60)
                time_str = f"{m}:{sec:02d}"
                return f"📞 Звонок ({time_str})"
            else:
                return "📞 Звонок"

    # 🔥 2. Если есть текст — приоритет тексту
    if hasattr(msg, 'text') and msg.text and msg.text.strip():
        return msg.text
    
    # 🔥 3. Проверка на файлы
    # Используем .first(), так как это безопаснее, чем [0]
    first_file = msg.files.all().first()
    
    if first_file:
        file_type = getattr(first_file, "type", "")
        if file_type == "image":
            return "📷 Фотография"
        elif file_type == "video":
            return "🎥 Видео"
        elif file_type == "audio":
            return "🎤 Голосовое сообщение"
        else:
            return "📎 Вложение"
            
    return "Сообщение"

    # return "Сообщение"


# В get_single_chat_summary добавь prefetch_related, чтобы не было 100500 запросов к БД
from django.db.models import Q

def get_single_chat_summary(user, chat_type, companion_id=None, product_id=None, group_id=None):
    try:
        # ==========================================
        # 1. ПРИВАТНЫЕ ЧАТЫ
        # ==========================================
        if chat_type == "private":
            msg = PrivateMessage.objects.filter(
                (Q(sender=user, target_id=companion_id) | Q(sender_id=companion_id, target=user))
            ).order_by("-created_at")\
             .select_related("sender", "target")\
             .prefetch_related("files")\
             .first()

            if not msg: 
                return None
            
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
                "is_own": msg.sender == user,
                "is_read": bool(msg.is_read),  # 🔥 ВОТ ЭТОГО НЕ ХВАТАЛО: статус из базы данных
                "link": f"/chat/private/{companion.id}",
            }

        # ==========================================
        # 2. ЧАТЫ ПО ТОВАРАМ
        # ==========================================
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
                "id": f"product_{product_id}_{companion_id}", 
                "type": "product",
                "product_id": product_id,
                "companion_id": companion_id,
                "title": msg.product.productName if msg.product else "Товар",
                "avatar": get_full_url(img_url),
                "last_message": format_last_message(msg),
                "last_message_at": msg.created_at.isoformat(),
                "unread_count": unread,
                "is_own": msg.sender == user,
                "is_read": bool(msg.is_read),  # 🔥 ВОТ ЭТОГО НЕ ХВАТАЛО: статус из базы данных
                "link": f"/chat/product/{product_id}/{companion_id}",
            }

        # ==========================================
        # 3. ГРУППОВЫЕ ЧАТЫ
        # ==========================================
        elif chat_type == "group":
            g = Group.objects.get(id=group_id)
            last_msg = GroupMessage.objects.filter(group=g)\
                .order_by("-created_at")\
                .prefetch_related("files")\
                .first()
            
            if not last_msg: 
                return None

            unread = GroupMessage.objects.filter(group=g).exclude(sender=user).exclude(read_by=user).count()
            group_avatar = g.avatar.url if g.avatar else None

            # Проверяем, прочитал ли кто-то в группе, кроме самого автора
            group_is_read = last_msg.read_by.exclude(id=user.id).exists() if hasattr(last_msg, 'read_by') else False

            return {
                "id": f"{g.id}",
                "type": "group",
                "title": g.title,
                "avatar": get_full_url(group_avatar),
                "last_message": format_last_message(last_msg),
                "last_message_at": last_msg.created_at.isoformat(),
                "unread_count": unread,
                "is_own": last_msg.sender == user,
                "is_read": group_is_read,  # 🔥 ВОТ ЭТОГО НЕ ХВАТАЛО
                "link": f"/groups/{g.id}/chat",
            }

    except Exception as e:
        import traceback
        print(f"❌ Error in get_single_chat_summary: {e}")
        traceback.print_exc()
        return None