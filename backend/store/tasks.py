from celery import shared_task
from django.core.management import call_command

@shared_task
def delete_old_files_task():
    # Вызываем твою команду management command
    call_command('clear_old_files')




from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

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