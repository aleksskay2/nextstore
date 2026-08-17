# store/management/commands/clear_old_files.py
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from store.models import (
    Story,
    PrivateMessage,
    PrivateMessageFile,
    GroupMessage,
    GroupMessageFile,
    Message,
    MessageFile,
)

class Command(BaseCommand):
    help = "Очистка устаревших историй (24ч) и старых сообщений с файлами (60 дней)"

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(self.style.NOTICE(f"🕒 Запуск очистки данных: {now.strftime('%Y-%m-%d %H:%M:%S')}"))

        # =========================================================================
        # 1. ИСТОРИИ (Stories): Удаляем все, у которых expires_at уже наступил
        # =========================================================================
        expired_stories = Story.objects.filter(expires_at__lte=now)
        stories_count = expired_stories.count()

        # Благодаря сигналам из signals.py файлы удалятся физически с диска
        for story in expired_stories:
            story.delete()

        self.stdout.write(self.style.SUCCESS(f"✅ Истории: удалено {stories_count} шт."))

        # =========================================================================
        # 2. ЧАТЫ ПО ТОВАРАМ (Message): Удаляем сообщения старше 60 дней
        # =========================================================================
        product_msgs_cutoff = now - timedelta(days=60)
        old_product_msgs = Message.objects.filter(created_at__lt=product_msgs_cutoff)
        product_msgs_count = old_product_msgs.count()

        # Каскадное удаление Message удалит связанные MessageFile и вызовет сигналы удаления файлов с SSD
        for msg in old_product_msgs:
            msg.delete()

        self.stdout.write(self.style.SUCCESS(f"✅ Чаты по товарам: удалено {product_msgs_count} сообщений."))

        # =========================================================================
        # 3. ПРИВАТНЫЕ СООБЩЕНИЯ (PrivateMessage): Старше 60 дней
        # =========================================================================
        pm_cutoff = now - timedelta(days=60)
        old_pm = PrivateMessage.objects.filter(created_at__lt=pm_cutoff)
        pm_count = old_pm.count()

        for msg in old_pm:
            msg.delete()

        self.stdout.write(self.style.SUCCESS(f"✅ Приватные сообщения: удалено {pm_count} сообщений."))

        # =========================================================================
        # 4. ГРУППОВЫЕ СООБЩЕНИЯ (GroupMessage): Старше 60 дней
        # =========================================================================
        group_cutoff = now - timedelta(days=60)
        old_group_msgs = GroupMessage.objects.filter(created_at__lt=group_cutoff)
        group_msgs_count = old_group_msgs.count()

        for msg in old_group_msgs:
            msg.delete()

        self.stdout.write(self.style.SUCCESS(f"✅ Групповые сообщения: удалено {group_msgs_count} сообщений."))

        self.stdout.write(self.style.SUCCESS("🎉 Очистка сервера успешно завершена!"))