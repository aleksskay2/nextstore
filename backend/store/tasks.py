import os
import tempfile
import logging
from io import BytesIO
from pathlib import Path

import ffmpeg
from PIL import Image

from celery import shared_task
from django.core.management import call_command
from django.core.mail import send_mail
from django.conf import settings
from django.core.files.base import ContentFile
from django.apps import apps

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


# ==========================================
# 1. СУЩЕСТВУЮЩИЕ ЗАДАЧИ (Оставлены без изменений)
# ==========================================

@shared_task
def delete_old_files_task():
    try:
        logger.info("🧹 Запуск плановой очистки старых файлов и историй...")
        call_command('clear_old_files')
        logger.info("✅ Плановая очистка завершена.")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка в delete_old_files_task: {e}")
        return False


@shared_task
def send_verification_email_task(user_email, verification_code):
    """
    Фоновая задача Celery для отправки кода подтверждения на почту
    """
    subject = "Код подтверждения регистрации"
    message = (
        f"Приветствуем!\n\n"
        f"Спасибо за регистрацию в нашем приложении.\n"
        f"Ваш код подтверждения: {verification_code}\n\n"
        f"Если вы не запрашивали этот код, просто проигнорируйте это письмо."
    )
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        logger.info(f"✅ Письмо с подтверждением успешно отправлено на {user_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка при отправке письма на {user_email}: {str(e)}")
        return False


# ==========================================
# 2. НОВЫЕ ЗАДАЧИ: ФОНОВАЯ ОБРАБОТКА МЕДИА
# ==========================================

@shared_task
def process_chat_media_task(app_label, model_name, instance_id):
    """
    Универсальная задача для файлов всех чатов (Private, Group, Region).
    Вычисляет длительность, делает превью (если его нет) и уведомляет фронтенд.
    """
    ModelClass = apps.get_model(app_label, model_name)
    try:
        obj = ModelClass.objects.get(id=instance_id)
    except ModelClass.DoesNotExist:
        return

    if not getattr(obj, 'file', None):
        return

    file_path = str(Path(obj.file.path))
    file_type = getattr(obj, 'type', None)
    
    updated = False

    # 1. АУДИО/ВИДЕО: Извлекаем длительность
    if file_type in ["audio", "video"] and not getattr(obj, 'duration', None):
        try:
            probe = ffmpeg.probe(file_path)
            obj.duration = int(float(probe['format']['duration']))
            updated = True
        except Exception as e:
            logger.error(f"⚠️ Ошибка длительности {model_name} #{instance_id}: {e}")

    # 2. ВИДЕО: Создаем превью, ТОЛЬКО ЕСЛИ фронтенд его не прислал
    if file_type == "video" and hasattr(obj, 'thumbnail') and not obj.thumbnail:
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_thumb:
                temp_thumb_path = temp_thumb.name

            try:
                (
                    ffmpeg
                    .input(file_path, ss=1)
                    .output(temp_thumb_path, vframes=1, format='image2', **{'update': 1})
                    .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
                )
            except ffmpeg.Error:
                (
                    ffmpeg
                    .input(file_path, ss=0)
                    .output(temp_thumb_path, vframes=1, format='image2', **{'update': 1})
                    .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
                )

            if os.path.exists(temp_thumb_path) and os.path.getsize(temp_thumb_path) > 0:
                with open(temp_thumb_path, 'rb') as f:
                    thumb_name = f"thumb_{Path(file_path).stem}.jpg"
                    obj.thumbnail.save(thumb_name, ContentFile(f.read()), save=False)
                    updated = True
            os.remove(temp_thumb_path)
        except Exception as e:
            logger.error(f"⚠️ Ошибка превью {model_name} #{instance_id}: {e}")

    # 3. ФОТО: Оптимизируем под WebP (опционально, если фронт не сжал)
    if file_type == "image":
        try:
            img = Image.open(file_path)
            if hasattr(obj, 'width') and hasattr(obj, 'height'):
                obj.width, obj.height = img.size

            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Делаем квадратное превью
            if hasattr(obj, 'thumbnail') and not obj.thumbnail:
                img.thumbnail((200, 200), Image.LANCZOS)
                output = BytesIO()
                img.save(output, format='WebP', quality=70)
                thumb_name = f"thumb_{Path(file_path).stem}.webp"
                obj.thumbnail.save(thumb_name, ContentFile(output.getvalue()), save=False)

            updated = True
        except Exception as e:
            logger.error(f"⚠️ Ошибка фото {model_name} #{instance_id}: {e}")

    # ================== ФИНАЛ: СОХРАНЕНИЕ И УВЕДОМЛЕНИЕ ==================
    if updated:
        update_fields = ['duration', 'thumbnail', 'width', 'height']
        valid_fields = [f for f in update_fields if hasattr(obj, f)]
        obj.save(update_fields=valid_fields)
        logger.info(f"✅ Медиа обработано: {model_name} #{instance_id}")

        # Уведомляем клиентов по WS, чтобы у них обновился UI
        try:
            channel_layer = get_channel_layer()
            msg = obj.message
            groups_to_notify = []

            model_lower = model_name.lower()
            if model_lower == 'messageregionfile':
                region_id = msg.region_id if msg.region else 0
                groups_to_notify.append(f"region_{region_id}")
            elif model_lower == 'groupmessagefile':
                groups_to_notify.append(f"group_{msg.group_id}")
            elif model_lower == 'privatemessagefile':
                groups_to_notify.append(f"chat_{msg.sender_id}")
                groups_to_notify.append(f"chat_{msg.target_id}")

            for group_name in groups_to_notify:
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "media_updated",
                        "message_id": msg.id,
                        "file_id": obj.id,
                        "updates": {
                            "duration": getattr(obj, 'duration', None),
                            "thumbnail": obj.thumbnail.url if getattr(obj, 'thumbnail', None) else None,
                            "width": getattr(obj, 'width', None),
                            "height": getattr(obj, 'height', None),
                        }
                    }
                )
        except Exception as e:
            logger.error(f"⚠️ Ошибка отправки WS-уведомления: {e}")


@shared_task
def process_product_image_task(product_image_id):
    """
    Фоновая конвертация изображений товара в WebP и создание миниатюр.
    """
    from store.models import ProductImage  # Локальный импорт, чтобы избежать circular import
    try:
        obj = ProductImage.objects.get(id=product_image_id)
    except ProductImage.DoesNotExist:
        return

    if not obj.image:
        return

    try:
        img = Image.open(obj.image.path)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        base_name = os.path.splitext(os.path.basename(obj.image.name))[0]

        # 1. Генерируем WEBP
        webp_io = BytesIO()
        img.save(webp_io, format="WEBP", quality=70)
        webp_content = ContentFile(webp_io.getvalue(), name=f"{base_name}.webp")
        obj.image_webp.save(webp_content.name, webp_content, save=False)

        # 2. Генерируем THUMBNAIL
        img_thumb = img.copy()
        img_thumb.thumbnail((300, 300), Image.LANCZOS)
        thumb_io = BytesIO()
        img_thumb.save(thumb_io, format="WEBP", quality=70)
        thumb_content = ContentFile(thumb_io.getvalue(), name=f"{base_name}_thumb.webp")
        obj.image_thumb.save(thumb_content.name, thumb_content, save=False)

        # 3. Сохраняем БД и удаляем исходник
        original_path = obj.image.path
        obj.image = None
        obj.save(update_fields=['image_webp', 'image_thumb', 'image'])

        if os.path.exists(original_path):
            os.remove(original_path)
            
        logger.info(f"✅ Успешно сжато изображение товара #{product_image_id}")
    except Exception as e:
        logger.error(f"❌ Ошибка обработки ProductImage #{product_image_id}: {e}")