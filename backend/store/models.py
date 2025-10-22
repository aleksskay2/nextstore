from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
from django.conf import settings
from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image
import os


# Create your models here.


class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    region = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.username


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                             related_name='bookmarks')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='bookmark_by')
    created_at = models.DateTimeField(auto_now_add=True)

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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              null=True, blank=True)
    storeName = models.CharField(max_length=100, null=True, blank=True)  # для user или admin, если нужно
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    main_image = models.ImageField(upload_to='products/main', null=True, blank=True)
    main_image_webp = models.ImageField(upload_to='product/webp', blank=True, null=True)
    main_image_thumb = models.ImageField(upload_to='products/thumbs/', blank=True, null=True)

    productName = models.CharField(max_length=100)
    address = models.CharField(max_length=100)
    dateUpdate = models.DateField(auto_now_add=True, null=True, blank=True)
    weight = models.CharField(max_length=50, null=True, blank=True)
    region = models.ForeignKey(Regions, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    description = models.CharField(max_length=2000, null=True, blank=True )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.main_image:
            img = Image.open(self.main_image)

            img_webp_io = BytesIO()
            img.save(img_webp_io, format='WEBP',   quality=70)
            webp_filename = os.path.splitext(self.main_image.name)[0] + '.webp'
            self.main_image_webp.save(webp_filename,
                                       ContentFile(img_webp_io.getvalue()), save=False)

            # создаем thumb
            img_thumb = img.copy()
            img_thumb.thumbnail((300, 300))
            thumb_io = BytesIO()
            img_thumb.save(thumb_io, format='WEBP', quality=70)
            thumb_filename = os.path.splitext(self.main_image.name)[0] + '_thumb.webp'
            self.main_image_thumb.save(thumb_filename, ContentFile(thumb_io.getvalue()), save=False)

            super().save(update_fields=['main_image_webp', 'main_image_thumb'])



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
    image = models.ImageField(upload_to='messages/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class MessageImage (models.Model):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='messages/')


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
    created_at = models.DateField(auto_now_add=True)
    
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
    image=models.ImageField(upload_to='product_images/')
    alt_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)



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











