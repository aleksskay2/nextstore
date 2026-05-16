from django.apps import AppConfig
# from .signals import signals

class StoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'store'

    def ready(self):
        # Импортируем сигналы именно здесь, чтобы они зарегистрировались
        # Замени 'store' на реальное название папки твоего приложения, если оно другое
        from . import signals
