from celery import shared_task
from django.core.management import call_command

@shared_task
def delete_old_files_task():
    # Вызываем твою команду management command
    call_command('clear_old_files')