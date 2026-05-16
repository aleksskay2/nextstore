# chat/management/commands/clear_old_files.py
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from store.models import PrivateMessageFile, GroupMessageFile, MessageFile, MessageRegionFile


class Command(BaseCommand):
    help = 'Удаляет файлы и превью старше 30 дней для всех типов сообщений'

    def handle(self, *args, **options):
        # Устанавливаем порог в 30 дней
        threshold = timezone.now() - timedelta(days=30)
        
        # Словарь моделей: Ключ - модель, Значение - список полей с файлами для удаления
        file_models = {
            MessageFile: ['file'],
            MessageRegionFile: ['file', 'thumbnail'],
            PrivateMessageFile: ['file', 'thumbnail'],
            GroupMessageFile: ['file']
        }
        
        total_deleted = 0

        for model, fields in file_models.items():
            # Фильтруем записи. 
            # Примечание: если в самой модели файла нет created_at, 
            # используй message__created_at для фильтрации по дате сообщения.
            try:
                old_records = model.objects.filter(message__created_at__lt=threshold)
            except Exception:
                # Если фильтр по message__created_at не сработал, пробуем напрямую
                old_records = model.objects.filter(created_at__lt=threshold)

            count = old_records.count()
            
            if count == 0:
                self.stdout.write(f"В {model.__name__} старых файлов не найдено.")
                continue

            with transaction.atomic():
                for record in old_records:
                    # Удаляем все файлы, связанные с записью (основной файл и превью)
                    for field_name in fields:
                        file_field = getattr(record, field_name, None)
                        
                        if file_field and file_field.name:
                            try:
                                # Удаляем файл из файловой системы
                                file_field.delete(save=False)
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(
                                    f"Ошибка удаления файла {field_name} в {model.__name__}: {e}"
                                ))

                    # Удаляем саму запись из БД
                    record.delete()
            
            total_deleted += count
            self.stdout.write(self.style.SUCCESS(f"Удалено {count} записей из {model.__name__}"))

        self.stdout.write(self.style.SUCCESS(f"--- Очистка завершена. Всего удалено записей: {total_deleted} ---"))