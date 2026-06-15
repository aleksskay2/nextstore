# from django.core.management.base import BaseCommand
# from django.utils import timezone
# from datetime import timedelta

# # 🔥 ЗАМЕНИ 'your_app_name' НА НАЗВАНИЕ ТВОЕГО ПРИЛОЖЕНИЯ
# from store.models import (
#     MessageFile, 
#     MessageRegionFile, 
#     PrivateMessageFile, 
#     GroupMessageFile
# )

# class Command(BaseCommand):
#     help = 'Удаляет медиафайлы старше 30 дней, оставляя сам текст сообщений'

#     def handle(self, *args, **kwargs):
#         # 1. Вычисляем дату отсечения (ровно 30 дней назад от текущей секунды)
#         cutoff_date = timezone.now() - timedelta(days=30)
        
#         self.stdout.write(f"🔍 Ищем файлы, отправленные до: {cutoff_date.strftime('%d.%m.%Y %H:%M')}")

#         # Список моделей, которые нужно почистить
#         file_models = [
#             MessageFile,
#             MessageRegionFile,
#             PrivateMessageFile,
#             GroupMessageFile
#         ]

#         total_deleted = 0

#         for model in file_models:
#             # 2. Ищем записи файлов, чье родительское сообщение старше 30 дней
#             old_files = model.objects.filter(message__created_at__lt=cutoff_date)
#             count = old_files.count()

#             if count > 0:
#                 for obj in old_files:
#                     # 3. Физически удаляем основной файл с жесткого диска
#                     if obj.file:
#                         obj.file.delete(save=False)
                    
#                     # 4. Физически удаляем thumbnail (миниатюру), если она есть
#                     if hasattr(obj, 'thumbnail') and obj.thumbnail:
#                         obj.thumbnail.delete(save=False)
                    
#                     # 5. Удаляем саму запись файла из базы данных 
#                     # (Сам текст сообщения в родительской таблице останется!)
#                     obj.delete()

#                 total_deleted += count
#                 self.stdout.write(self.style.SUCCESS(f"✅ Удалено {count} файлов из {model.__name__}"))
#             else:
#                 self.stdout.write(f"ℹ️ В {model.__name__} старых файлов не найдено.")

#         self.stdout.write(self.style.SUCCESS(f"🚀 Очистка завершена! Всего удалено файлов: {total_deleted}"))