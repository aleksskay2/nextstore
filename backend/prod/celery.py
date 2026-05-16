# your_project/celery.py
import os
from celery import Celery

# Указываем настройки Django для celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

app = Celery('base')

# Читаем конфиг из settings.py, префикс CELERY_ означает настройки для Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически ищем задачи (tasks.py) во всех установленных приложениях (INSTALLED_APPS)
app.autodiscover_tasks()