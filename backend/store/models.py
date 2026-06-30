from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
from django.conf import settings
from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image
import os
from django.utils import timezone
from datetime import timedelta
from django.utils.timezone import now
from django.core.files.storage import default_storage
from django.contrib.postgres.fields import ArrayField
import ffmpeg


# Create your models here.


class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    region = models.CharField(max_length=100, null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)

    is_open = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class FCMDevice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    expo_push_token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Token for {self.user.username}"



class ExpoPushToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.token}"


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                             related_name='bookmarks')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='bookmark_by')
    created_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        verbose_name = 'bookmark'
        verbose_name_plural = 'bookmarks'

    def __str__(self):
        return f"{self.user.username} - {self.product.productName}"



class Category(models.Model):
    CategoryName = models.CharField(max_length=100)
    parent = models.ForeignKey('self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='subcategories'
    )
    

    class Meta:
        verbose_name  = "Category"
        verbose_name_plural = "Categories"


    def __str__(self):
        return self.CategoryName

    def get_all_subcategories(self):
        subcategories = []
        def collect_subcategories(category):
            subs = category.subcategories.all()
            for sub in subs:
                subcategories.append(sub)
                collect_subcategories(sub)
        collect_subcategories(self)
        return subcategories

    

class Regions(models.Model):
    nameRegions = models.CharField(max_length=100)


    class Meta:
        verbose_name  = "Region"
        verbose_name_plural = "Regions"

    def __str__(self):
        return self.nameRegions
    

class One(models.Model):
    nameOne = models.CharField(max_length=200)


class SelectionObject(models.Model):
    nameObject = models.CharField(max_length=100)

    class Meta:
        verbose_name  = "SelectionObject"
        verbose_name_plural = "SelectionObjects"


    def __str__(self):
        return self.nameObject


class Product(models.Model):
    PRODUCT_TYPE_CHOICES = (
        ('owner', 'Owner'),
        ('user', 'User'),
    )
    productUser = models.CharField(max_length=10, choices=PRODUCT_TYPE_CHOICES)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        null=True,
        blank=True,
        
    )
    #номер телефона для товара незарегистрированных пользователец
    user_phone = models.CharField(max_length=20, null=True, blank=True)

    #vip - объявление
    is_vip = models.BooleanField(default=False)
    vip_until = models.DateTimeField(null=True, blank=True)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    storeName = models.CharField(max_length=100, null=True, blank=True)  # для user или admin, если нужно
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    main_image = models.ImageField(upload_to='product/webp/products/main', null=True, blank=True)
    main_image_webp = models.ImageField(upload_to='product/webp', blank=True, null=True)
    main_image_thumb = models.ImageField(upload_to='products/thumbs/', blank=True, null=True)

    productName = models.CharField(max_length=100)
    address = models.CharField(max_length=100)
    dateUpdate = models.DateField(auto_now=True, null=True, blank=True)
    weight = models.CharField(max_length=50, null=True, blank=True)
    region = models.ForeignKey(Regions, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    description = models.CharField(max_length=2000, null=True, blank=True )

    # def save(self, *args, **kwargs):
    #     super().save(*args, **kwargs)

    #     if self.main_image:
    #         img = Image.open(self.main_image)

    #         img_webp_io = BytesIO()
    #         img.save(img_webp_io, format='WEBP',   quality=70)
    #         webp_filename = os.path.splitext(self.main_image.name)[0] + '.webp'
    #         self.main_image_webp.save(webp_filename,
    #                                    ContentFile(img_webp_io.getvalue()), save=False)

    #         # создаем thumb
    #         img_thumb = img.copy()
    #         img_thumb.thumbnail((300, 300))
    #         thumb_io = BytesIO()
    #         img_thumb.save(thumb_io, format='WEBP', quality=70)
    #         thumb_filename = os.path.splitext(self.main_image.name)[0] + '_thumb.webp'
    #         self.main_image_thumb.save(thumb_filename, ContentFile(thumb_io.getvalue()), save=False)

    #         super().save(update_fields=['main_image_webp', 'main_image_thumb'])

    # def save(self, *args, **kwargs):
        # super().save(*args, **kwargs)

        # if self.main_image:
        #     img_path = self.main_image.path

        #     # Открытие изображения
        #     with Image.open(img_path) as img:
        #         # Создаем webp
        #         img_webp_io = BytesIO()
        #         img.save(img_webp_io, format="WEBP", quality=70)
        #         webp_filename = os.path.splitext(self.main_image.name)[0] + ".webp"
        #         self.main_image_webp.save(webp_filename, ContentFile(img_webp_io.getvalue()), save=False)

        #         # Создаем thumb
        #         img_thumb = img.copy()
        #         img_thumb.thumbnail((300, 300))
        #         thumb_io = BytesIO()
        #         img_thumb.save(thumb_io, format="WEBP", quality=70)
        #         thumb_filename = os.path.splitext(self.main_image.name)[0] + "_thumb.webp"
        #         self.main_image_thumb.save(thumb_filename, ContentFile(thumb_io.getvalue()), save=False)

        #     # Теперь файл закрыт, можно удалять
        #     if os.path.exists(img_path):
        #         os.remove(img_path)

        #     # очищаем поле
        #     self.main_image = None

        #     super().save(update_fields=['main_image_webp', 'main_image_thumb', 'main_image'])

    def save(self, *args, **kwargs):
        # сначала обычный save, чтобы получить object id и т.д.
        super().save(*args, **kwargs)

        if not self.main_image:
            return

        # Открываем изображение через поле file (поддерживает S3)
        img = Image.open(self.main_image)
        img.convert("RGB")

        base_name = os.path.splitext(os.path.basename(self.main_image.name))[0]

        # webp
        webp_io = BytesIO()
        img.save(webp_io, format="WEBP", quality=70)
        webp_file = ContentFile(webp_io.getvalue(), name=f"{base_name}.webp")
        self.main_image_webp.save(webp_file.name, webp_file, save=False)

        # thumb
        thumb = img.copy()
        thumb.thumbnail((300, 300))
        thumb_io = BytesIO()
        thumb.save(thumb_io, format="WEBP", quality=70)
        thumb_file = ContentFile(thumb_io.getvalue(), name=f"{base_name}_thumb.webp")
        self.main_image_thumb.save(thumb_file.name, thumb_file, save=False)

        # закрываем и удаляем оригинал через storage
        try:
            if hasattr(self.main_image, 'close'):
                self.main_image.close()
            if default_storage.exists(self.main_image.name):
                default_storage.delete(self.main_image.name)
        except Exception:
            pass

        # Оставляем main_image пустым (как у тебя)
        self.main_image = None

        super().save(update_fields=['main_image_webp', 'main_image_thumb', 'main_image'])




    def set_vip(self, days: int):
        self.is_vip = True
        if self.vip_until and self.vip_until > timezone.now():
            self.vip_until += timedelta(days=days)   # продлеваем
        else:
            self.vip_until = timezone.now() + timedelta(days=days)
        self.save(update_fields=["is_vip", "vip_until"])

    def deactivate_expired_vip():
        Product.objects.filter(is_vip=True, vip_until__lt=now()).update(is_vip=False)


class VipPlan(models.Model):
    days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sent_messages',
        on_delete=models.CASCADE)
   
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_messages',
        on_delete=models.CASCADE
    )
    product = models.ForeignKey('Product', on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    # image = models.ImageField(upload_to='messages/', blank=True, null=True)
  
    # ✅ доставлено (собеседник открыл чат)
    is_delivered = models.BooleanField(default=False)

    # ✅ прочитано
    is_read = models.BooleanField(default=False)

    # ⚠️ ВАЖНО: auto_now_add, а не auto_now
    created_at = models.DateTimeField(auto_now_add=True)



class MessageFile(models.Model):
    message = models.ForeignKey(
        Message,
        related_name="files",
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to="messages/files/", null=True, blank=True)
    
    # 🔥 Добавляем thumbnail для видео
    thumbnail = models.ImageField(
        upload_to="messages/thumbnails/",
        null=True,
        blank=True
    )

    type = models.CharField(
        max_length=20,
        choices=(
            ("image", "Image"),
            ("video", "Video"),
            ("audio", "Audio"),
            ("file", "File"), # добавили общий тип файла
        )
    )
    
    duration = models.PositiveIntegerField(null=True, blank=True) # для голосовых и видео
    is_downloaded = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} for message {self.message.id}"

    def save(self, *args, **kwargs):
        # Сохраняем сначала, чтобы файл физически появился на диске
        super().save(*args, **kwargs)

        if not self.file:
            return

        try:
            import ffmpeg
            
            file_path = str(Path(self.file.path))

            # 🔥 1. Извлечение длительности (audio/video)
            if self.type in ["audio", "video"] and not self.duration:
                probe = ffmpeg.probe(file_path)
                duration = int(float(probe['format']['duration']))
                self.duration = duration
                super().save(update_fields=["duration"])

            # 🔥 2. Создание превью (только для видео)
            if self.type == "video" and not self.thumbnail:
                # Определяем папку для превью внутри MEDIA_ROOT
                thumb_relative_dir = "messages/thumbnails"
                thumb_absolute_dir = os.path.join(settings.MEDIA_ROOT, thumb_relative_dir)
                os.makedirs(thumb_absolute_dir, exist_ok=True)

                thumb_filename = f"{Path(file_path).stem}_thumb.jpg"
                thumb_path = os.path.join(thumb_absolute_dir, thumb_filename)

                # Генерируем кадр на 1-й секунде
                (
                    ffmpeg
                    .input(file_path, ss=1)
                    .output(thumb_path, vframes=1)
                    .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
                )

                # Сохраняем относительный путь в базу
                self.thumbnail = os.path.join(thumb_relative_dir, thumb_filename)
                super().save(update_fields=["thumbnail"])

        except Exception as e:
            print(f"❌ Ошибка обработки MessageFile (id: {self.id}): {e}")



class ProductReview (models.Model):
    product = models.ForeignKey(
        Product,
        related_name='product_reviews',
        on_delete=models.CASCADE
    )

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='reviews_written',
        on_delete=models.CASCADE
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateField(auto_now=True)
    
    class Meta:
        unique_together = ('product', 'reviewer')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.reviewer} by {self.product} ({self.rating})'


class ProductImage(models.Model):
    product = models.ForeignKey(
        'Product',
        related_name='images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='product_images/')
    image_webp = models.ImageField(upload_to='product_images/webp/', blank=True, null=True)
    image_thumb = models.ImageField(upload_to='product_images/thumbs/', blank=True, null=True)

    alt_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
       


        # если нет загруженного файла — обычный save
        if not self.image:
            return super().save(*args, **kwargs)

        # Откроем изображение из FileField (работает и для S3)
        img = Image.open(self.image)
        img.convert("RGB")  # на всякий случай

        base_name = os.path.splitext(os.path.basename(self.image.name))[0]

        # WEBP
        webp_io = BytesIO()
        img.save(webp_io, format="WEBP", quality=70)
        webp_content = ContentFile(webp_io.getvalue(), name=f"{base_name}.webp")
        self.image_webp.save(webp_content.name, webp_content, save=False)

        # THUMB
        img_thumb = img.copy()
        img_thumb.thumbnail((300, 300))
        thumb_io = BytesIO()
        img_thumb.save(thumb_io, format="WEBP", quality=70)
        thumb_content = ContentFile(thumb_io.getvalue(), name=f"{base_name}_thumb.webp")
        self.image_thumb.save(thumb_content.name, thumb_content, save=False)

        # Удаляем оригинал через storage (если хранится)
        # но не вызываем os.remove на .path
        try:
            if hasattr(self.image, 'close'):
                self.image.close()
            # удаляем файл через default_storage
            if default_storage.exists(self.image.name):
                default_storage.delete(self.image.name)
        except Exception:
            pass

        # Обнуляем original поле (как у тебя)
        self.image = None

        super().save(*args, **kwargs)



    def delete(self, *args, **kwargs):
        # Удаляем webp
        if self.image_webp and os.path.isfile(self.image_webp.path):
            os.remove(self.image_webp.path)

        # Удаляем thumb
        if self.image_thumb and os.path.isfile(self.image_thumb.path):
            os.remove(self.image_thumb.path)

        # Если вдруг остался оригинал (редко)
        if self.image and os.path.isfile(self.image.path):
            os.remove(self.image.path)

        super().delete(*args, **kwargs)


class FeatureTemplate(models.Model):
    category = models.ForeignKey('Category', on_delete=models.CASCADE, related_name='feature_templates')
    nameFeature = models.CharField(max_length=100)

    def __str__ (self):
        return f"{self.category.CategoryName}:{self.nameFeature}"



class FeatureProduct(models.Model):
    valueFeature = models.CharField(max_length=100)
    feature_template = models.ForeignKey(
        FeatureTemplate,
        on_delete=models.CASCADE,
        related_name='features',
        null=True,
        blank=True
    )
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='features')
    
    class Meta:
        verbose_name  = "FeatureStoreAdmin"
        verbose_name_plural = "FeatureStoreAdmins"

    def __str__(self):
        return f'{self.feature_template.nameFeature}:{self.valueFeature}'


class Admins(models.Model):
    surname = models.CharField(max_length=100)
    loginAdmin = models.CharField(max_length=100)
    mailAdmin = models.CharField(max_length=100)
    passwordAdmin = models.CharField(max_length=100)
    fk_Product = models.ForeignKey(Product, on_delete=models.CASCADE)


    class Meta:
        verbose_name  = "Admin"
        verbose_name_plural = "Admins"

    def __str__(self):
        return self.loginAdmin





import os
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db import models
from django.conf import settings
# Не забудь: pip install moviepy pillow
# from moviepy.editor import VideoFileClip 



class MessageRegionChat(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="region_messages"
    )
    region = models.ForeignKey(
        "Regions", # Убедись, что модель Regions создана в этом же приложении или укажи 'app_name.Regions'
        on_delete=models.CASCADE,
        related_name="region_messages",
        null=True,
        blank=True
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Исправляем E300: используем имя модели строкой 'MessageRegionChat'
    reply_to = models.ForeignKey(
        'MessageRegionChat', 
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replies"
    )

    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["region", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.region_id}"


class MessageRegionFile(models.Model):
    FILE_TYPES = (
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
    )
    
    message = models.ForeignKey(
        MessageRegionChat,
        related_name="files",
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to="region/messages/")
    thumbnail = models.ImageField(upload_to="region/messages/thumbnails/", null=True, blank=True)
    
    type = models.CharField(max_length=20, choices=FILE_TYPES)
    duration = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        
        super().save(*args, **kwargs)

        if is_new and self.file:
            if self.type == 'image':
                self.process_image()
            elif self.type == 'video':
                self.process_video()
            elif self.type == 'audio':  # 🔥 Добавили ветку для аудио
                self.process_audio()

    def process_image(self):
        """Сжатие оригинала в WebP и создание миниатюры"""
        img = Image.open(self.file.path)
        
        # Обновляем размеры для БД
        self.width, self.height = img.size

        # 1. Сжатие основного изображения
        output = BytesIO()
        img_copy = img.copy()
        if img_copy.mode in ("RGBA", "P"):
            img_copy = img_copy.convert("RGB")
        
        img_copy.thumbnail((1280, 1280), Image.LANCZOS)
        img_copy.save(output, format='WebP', quality=80, optimize=True)
        
        name = os.path.splitext(os.path.basename(self.file.name))[0] + ".webp"
        self.file.save(name, ContentFile(output.getvalue()), save=False)

        # 2. Создание квадратного превью
        thumb_data = self.make_square_thumb(img)
        self.thumbnail.save(f"thumb_{name}", thumb_data, save=False)
        
        super().save(update_fields=['file', 'thumbnail', 'width', 'height'])

    def process_audio(self):
        """Извлечение длительности аудио через ffmpeg"""
        try:
            import ffmpeg
            from pathlib import Path
            
            file_path = str(Path(self.file.path))
            probe = ffmpeg.probe(file_path)
            
            # Достаем длительность и округляем до целых секунд
            self.duration = int(float(probe['format']['duration']))
            super().save(update_fields=['duration'])
            
        except Exception as e:
            print(f"Audio processing error: {e}")

    def process_video(self):
        """Извлечение кадра и длительности видео через ffmpeg/moviepy"""
        try:
            # 1. Сначала извлекаем длительность через ffmpeg (как в личных сообщениях)
            import ffmpeg
            from pathlib import Path
            import os
            
            file_path = str(Path(self.file.path))
            probe = ffmpeg.probe(file_path)
            self.duration = int(float(probe['format']['duration']))
            
            # 2. Создаем миниатюру через moviepy (твой оригинальный код)
            clip = VideoFileClip(self.file.path)
            self.width, self.height = clip.size

            frame_time = min(1.0, clip.duration / 2)
            frame = clip.get_frame(frame_time)
            img = Image.fromarray(frame)
            
            thumb_data = self.make_square_thumb(img)
            name = os.path.splitext(os.path.basename(self.file.name))[0]
            self.thumbnail.save(f"thumb_{name}.webp", thumb_data, save=False)
            
            clip.close()
            
            # Сохраняем обновленные поля
            super().save(update_fields=['thumbnail', 'duration', 'width', 'height'])
            
        except Exception as e:
            print(f"Video processing error: {e}")

    def make_square_thumb(self, img):
        """Создает квадратный ContentFile 200x200"""
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        w, h = img.size
        min_side = min(w, h)
        left = (w - min_side) / 2
        top = (h - min_side) / 2
        img = img.crop((left, top, left + min_side, top + min_side))
        img.thumbnail((200, 200), Image.LANCZOS)
        
        output = BytesIO()
        img.save(output, format='WebP', quality=70)
        output.seek(0)
        return ContentFile(output.read())





# class PrivateMessage(models.Model):
#     sender = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         related_name="sent_dm",
#         on_delete=models.CASCADE
#     )
#     target = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         related_name="received_dm",
#         on_delete=models.CASCADE
#     )

#     text = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     is_delivered = models.BooleanField(default=False)
#     is_read = models.BooleanField(default=False)



class PrivateMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_dm",
        on_delete=models.CASCADE
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_dm",
        on_delete=models.CASCADE
    )

    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_delivered = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    # 🔥 ОТВЕТ НА СООБЩЕНИЕ
    reply_to = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="replies",
        on_delete=models.SET_NULL
    )





# class PrivateMessageFile(models.Model):
#     message = models.ForeignKey(
#         PrivateMessage,
#         related_name="files",
#         on_delete=models.CASCADE
#     )
#     file = models.FileField(upload_to="private_chat/")
#     type = models.CharField(
#         max_length=20,
#         choices=(
#             ("image", "Image"),
#             ("video", "Video"),
#             ("audio", "Audio"),  # 🔥
#         )
#     )
#     duration = models.PositiveIntegerField(null=True, blank=True)  # 🔥 секунды

#     def save(self, *args, **kwargs):
#         super().save(*args, **kwargs)
#         if self.type == "audio" or self.type == "video":
#             from pathlib import Path
            
#             try:
#                 path = str(Path(self.file.path))
#                 probe = ffmpeg.probe(path)
#                 self.duration = int(float(probe['format']['duration']))
#                 super().save(update_fields=["duration"])
#             except Exception as e:
#                 print("Ошибка при определении длительности:", e)


class PrivateMessageFile(models.Model):
    message = models.ForeignKey(
        PrivateMessage,
        related_name="files",
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to="private_chat/", null=True, blank=True)

    # 🔥 NEW: thumbnail
    thumbnail = models.ImageField(
        upload_to="private_chat/thumbnails/",
        null=True,
        blank=True
    )

    type = models.CharField(
        max_length=20,
        choices=(
            ("image", "Image"),
            ("video", "Video"),
            ("audio", "Audio"),
            ("file", "File"),
        )
    )

    duration = models.PositiveIntegerField(null=True, blank=True)
    is_downloaded = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        is_new = self.pk is None  # 👈 важно
        super().save(*args, **kwargs)

        if not self.file:
            return

        try:
            from pathlib import Path
            import ffmpeg
            import os

            file_path = str(Path(self.file.path))

            # 🔥 1. ДЛИТЕЛЬНОСТЬ (audio/video)
            if self.type in ["audio", "video"] and not self.duration:
                probe = ffmpeg.probe(file_path)
                duration = int(float(probe['format']['duration']))
                self.duration = duration
                super().save(update_fields=["duration"])

            # 🔥 2. THUMBNAIL ТОЛЬКО ДЛЯ ВИДЕО
            if self.type == "video" and not self.thumbnail:
                thumb_dir = os.path.join(
                    os.path.dirname(file_path),
                    "thumbnails"
                )
                os.makedirs(thumb_dir, exist_ok=True)

                thumb_filename = f"{Path(file_path).stem}.jpg"
                thumb_path = os.path.join(thumb_dir, thumb_filename)

                # 🎬 создаём thumbnail (1 секунда видео)
                (
                    ffmpeg
                    .input(file_path, ss=1)
                    .output(thumb_path, vframes=1)
                    .run(overwrite_output=True)
                )

                # сохраняем в модель
                relative_path = f"private_chat/thumbnails/{thumb_filename}"
                self.thumbnail = relative_path
                super().save(update_fields=["thumbnail"])

        except Exception as e:
            print("Ошибка обработки файла:", e)



    





class Group(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="groups/avatars/", blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_groups"
    )

    

    is_private = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title



class GroupMember(models.Model):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
    )

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")

   

    class Meta:
        unique_together = ("group", "user")


class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    reply_to = models.ForeignKey(
    "self",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="replies" )
   
    # 🔥 кто прочитал сообщение
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="read_messages",
        blank=True
    )

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["group", "created_at"]),
        ]



import os
import ffmpeg
from pathlib import Path  # <--- Добавь эту строку
from django.core.files.base import ContentFile
from django.db import models

class GroupMessageFile(models.Model):
    message = models.ForeignKey(
        'GroupMessage', # Убедись, что имя модели верное
        related_name="files",
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to="groups/messages/")
    
    # 🔥 NEW: Поле для миниатюры
    thumbnail = models.ImageField(
        upload_to="groups/messages/thumbnails/",
        null=True, 
        blank=True
    )


    

    type = models.CharField(
        max_length=20,
        choices=(
            ("image", "Image"),
            ("video", "Video"),
            ("audio", "Audio"),
        )
    )
    duration = models.PositiveIntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # 1. Сохраняем файл первый раз, чтобы получить путь на диске
        super().save(*args, **kwargs)

        if not self.file:
            return

        try:
            import ffmpeg
            file_path = str(Path(self.file.path))

            # 🔥 2. ДЛИТЕЛЬНОСТЬ (audio/video)
            if self.type in ["audio", "video"] and not self.duration:
                probe = ffmpeg.probe(file_path)
                duration = int(float(probe['format']['duration']))
                self.duration = duration
                # Используем update_fields, чтобы не зациклить save()
                super().save(update_fields=["duration"])

            # 🔥 3. THUMBNAIL ТОЛЬКО ДЛЯ ВИДЕО
            if self.type == "video" and not self.thumbnail:
                # Определяем директорию для превью (внутри медиа-папки)
                thumb_dir = os.path.join(os.path.dirname(file_path), "thumbnails")
                os.makedirs(thumb_dir, exist_ok=True)

                thumb_filename = f"thumb_{Path(file_path).stem}.jpg"
                thumb_path = os.path.join(thumb_dir, thumb_filename)

                # Захватываем кадр на 1-й секунде
                (
                    ffmpeg
                    .input(file_path, ss=1)
                    .output(thumb_path, vframes=1)
                    .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
                )

                # Сохраняем относительный путь для БД
                # Относительно корня MEDIA_ROOT
                relative_thumb_path = f"groups/messages/thumbnails/{thumb_filename}"
                self.thumbnail = relative_thumb_path
                super().save(update_fields=["thumbnail"])

        except Exception as e:
            print(f"❌ Ошибка GroupMessage обработчика: {e}")
    




# models.py
class Story(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE, related_name="stories")
    media = models.FileField(upload_to="stories/")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

class StoryView(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="views")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("story", "user")




class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following"
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")
        indexes = [
            models.Index(fields=["follower", "following"]),
        ]

    def __str__(self):
        return f"{self.follower} → {self.following}"
