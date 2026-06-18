from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache




def invalidate_user_cache(user_id):
    cache.delete(f"user_full_profile:{user_id}")



def send_activation_email():
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    activation_link = f"{settings.FRONTEND_URL}/activate?uid={uid}&token={token}"

    context = {'user':user, 'activation_link':activation_link}

    subject = 'Потвердите ваш email'
    text_body = render_to_string('emails/activation.txt', context)
    html_body = render_to_string('emails/activation.html', context)

    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_body, 'text/html')
    msg.send()





import subprocess

def get_audio_duration(file_path: str) -> int | None:
    """
    Возвращает длительность аудио в секундах (int)
    или None, если не удалось определить
    """
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return None

        duration = float(result.stdout.strip())
        return max(1, round(duration))  # минимум 1 сек

    except Exception as e:
        print("FFPROBE ERROR:", e)
        return None





# # services.py
# import requests
# from .models import ExpoPushToken

# import requests
# import os

# import firebase_admin
# from firebase_admin import credentials, messaging


# if not firebase_admin._apps:
#     # Укажи правильный путь к скачанному JSON-файлу
#     # Например, если он лежит рядом с manage.py:
#     cred_path = os.path.join(settings.BASE_DIR, 'firebase-adminsdk.json') 
#     cred = credentials.Certificate(cred_path)
#     firebase_admin.initialize_app(cred)


# # (Убедись, что firebase_admin инициализирован где-то в настройках Django)
# # cred = credentials.Certificate("путь_к_твоему_google-services.json")
# # firebase_admin.initialize_app(cred)

# def send_push_notification(user, title=None, body=None, data=None):
#     print(f"🔍 [Utils] Ищем устройства для пользователя: {user.username} (ID: {user.id})")
    
#     devices = user.devices.all() 
#     print(f"📊 [Utils] Найдено устройств в базе: {devices.count()}")

#     # ⚠️ ВАЖНО: Тебе нужны именно FCM токены, а не Expo-токены!
#     # На фронтенде получай их через messaging().getToken()
#     tokens = [d.expo_push_token for d in devices if d.expo_push_token]
    
#     if not tokens:
#         print("⚠️ [Utils] FCM Токены не найдены. Отмена отправки.")
#         return

#     print(f"📲 [Utils] Подготовка к отправке на FCM токены: {tokens}")

#     messages = []
#     for token in tokens:
        
#         # 🔥 ПРЕВРАЩАЕМ ВСЕ ДАННЫЕ В СТРОКИ:
#         # Если data есть, делаем { 'ключ': 'значение_строкой' }
#         safe_data = {str(k): str(v) for k, v in data.items()} if data else {}

#         # Базовая структура только с данными
#         message_kwargs = {
#             "token": token,
#             "data": safe_data, # <-- ИСПОЛЬЗУЕМ ОЧИЩЕННЫЕ ДАННЫЕ ЗДЕСЬ
#             "android": messaging.AndroidConfig(
#                 priority='high' 
#             )
#         }

#         # 🔥 МАГИЯ ЗДЕСЬ:
#         # Если это НЕ звонок (есть текст), добавляем блок notification
#         if title or body:
#             message_kwargs["notification"] = messaging.Notification(
#                 title=title,
#                 body=body
#             )
#             # Добавляем канал для обычных уведомлений
#             message_kwargs["android"].notification = messaging.AndroidNotification(
#                 channel_id="alerts_v1",
#                 sound="default"
#             )

#         # Создаем объект сообщения Firebase
#         messages.append(messaging.Message(**message_kwargs))

#     try:
#         print("🌐 [Utils] Отправка запросов напрямую в Firebase...")
#         # Отправляем пакетно (до 500 сообщений за раз)
#         response = messaging.send_each(messages)
#         print(f"✅ [Utils] Успешно отправлено: {response.success_count}, Ошибок: {response.failure_count}")
        
#         # Если хочешь посмотреть детальные ошибки:
#         for idx, resp in enumerate(response.responses):
#             if not resp.success:
#                 print(f"❌ Ошибка отправки на токен {tokens[idx]}: {resp.exception}")

#     except Exception as e:
#         print(f"❌ [Utils] ОШИБКА при запросе к Firebase: {e}")




import os
import threading
from django.conf import settings
from firebase_admin import credentials, messaging
import firebase_admin

# 🔥 1. ИМПОРТ ПРАВИЛЬНОЙ МОДЕЛИ
from .models import FCMDevice 

# =========================================================
# ИНИЦИАЛИЗАЦИЯ FIREBASE (С АВТООПРЕДЕЛЕНИЕМ ПУТИ НА RENDER)
# =========================================================
if not firebase_admin._apps:
    render_secret_path = '/etc/secrets/firebase-adminsdk.json'
    local_path = os.path.join(settings.BASE_DIR, 'firebase-adminsdk.json') 
    
    # Если секрет Render существует, используем его, иначе ищем локально
    cred_path = render_secret_path if os.path.exists(render_secret_path) else local_path
    print(f"🔥 [Firebase Init] Использование файла конфигурации из: {cred_path}")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


# =========================================================
# ВНУТРЕННЯЯ ФУНКЦИЯ ДЛЯ СИНХРОННОЙ ОТПРАВКИ
# =========================================================
def _execute_send_each(messages, tokens):
    """Выполняет реальный сетевой запрос к Firebase в отдельном потоке"""
    try:
        print("🌐 [Utils - Thread] Отправка запросов напрямую в Firebase...")
        response = messaging.send_each(messages)
        print(f"✅ [Utils - Thread] Успешно отправлено: {response.success_count}, Ошибок: {response.failure_count}")
        
        for idx, resp in enumerate(response.responses):
            if not resp.success:
                error_msg = str(resp.exception)
                bad_token = tokens[idx]
                print(f"❌ Ошибка отправки на токен {bad_token}: {error_msg}")
                
                # 🔥 МАГИЯ ЗДЕСЬ: Автоочистка базы от мертвых токенов
                if "Requested entity was not found" in error_msg or "UNREGISTERED" in error_msg or "invalid registration" in error_msg.lower():
                    FCMDevice.objects.filter(expo_push_token=bad_token).delete()
                    print(f"🗑️ [Автоочистка] Мертвый токен удален из базы: {bad_token}")

    except Exception as e:
        print(f"❌ [Utils - Thread] ОШИБКА при запросе к Firebase: {e}")


# =========================================================
# ОСНОВНАЯ ФУНКЦИЯ (ВЫЗЫВАЕТСЯ В СИГНАЛАХ)
# =========================================================
def send_push_notification(user, title=None, body=None, data=None):
    print(f"🔍 [Utils] Ищем устройства для пользователя: {user.username} (ID: {user.id})")
    
    # Прямая выборка устройств из корректной таблицы FCMDevice
    devices = FCMDevice.objects.filter(user=user)
    print(f"📊 [Utils] Найдено устройств в базе FCMDevice: {devices.count()}")

    # Собираем токены устройств
    tokens = [d.expo_push_token for d in devices if d.expo_push_token]
    
    if not tokens:
        print("⚠️ [Utils] FCM Токены не найдены. Отмена отправки.")
        return

    print(f"📲 [Utils] Подготовка к отправке на FCM токены: {tokens}")

    messages = []
    for token in tokens:
        safe_data = {str(k): str(v) for k, v in data.items()} if data else {}

        message_kwargs = {
            "token": token,
            "data": safe_data,
            "android": messaging.AndroidConfig(
                priority='high' 
            ),
            "apns": messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        content_available=True,
                        sound="default"
                    )
                )
            )
        }

        if title or body:
            message_kwargs["notification"] = messaging.Notification(
                title=title,
                body=body
            )
            message_kwargs["android"].notification = messaging.AndroidNotification(
                channel_id="alerts_v1",
                sound="default"
            )

        messages.append(messaging.Message(**message_kwargs))

    # Запуск сетевого запроса в изолированном фоновом потоке
    push_thread = threading.Thread(
        target=_execute_send_each,
        args=(messages, tokens)
    )
    push_thread.daemon = True
    push_thread.start()