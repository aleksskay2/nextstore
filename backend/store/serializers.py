from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from .models import Admins, Product,ProductReview,  Follow, Story, PrivateMessageFile, PrivateMessage, FeatureTemplate, ProductImage, Bookmark, Message, SelectionObject, Regions, Category, FeatureProduct, CustomUser
from .models import Group, GroupMember, GroupMessage, MessageFile, GroupMessageFile, MessageRegionChat, MessageRegionFile

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from django.utils.timezone import localtime

from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework.fields import ImageField
from rest_framework.reverse import reverse




User = get_user_model()

import random
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings

# 🔥 ИМПОРТИРУЙ ТВОЮ ЗАДАЧУ CELERY (укажи правильный путь к твоему приложению вместо 'your_app')
from store.tasks import send_verification_email_task 

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    
    password = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        validators=[validate_password]
    )
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'region']

    def validate(self, attrs):
        phone = attrs.get('phone')
        username = attrs.get('username')
        password = attrs.get('password')
        email = attrs.get('email')

        # Если регистрируются по классическому пути (без телефона)
        if not phone:
            if not username:
                raise serializers.ValidationError({"username": "Имя пользователя обязательно."})
            if not password:
                raise serializers.ValidationError({"password": "При регистрации по Email пароль обязателен."})
            if not email:
                raise serializers.ValidationError({"email": "При регистрации по Email почта обязательна."})
            
            # Проверяем уникальность email, чтобы избежать ошибок бэкенда при сохранении
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "Пользователь с такой почтой уже зарегистрирован."})
        
        return attrs

    
    def create(self, validated_data):
        import random # Убедитесь, что импорт есть вверху файла
        phone = validated_data.get('phone')
        password = validated_data.get('password')
        email = validated_data.get('email', '')
        
        username = validated_data.get('username')
        if not username and phone:
            username = f"user_{phone[-4:]}"

        while User.objects.filter(username=username).exists():
            username = f"user_{phone[-4:]}_{random.randint(10, 99)}"

        # 1. Генерируем код ЗАРАНЕЕ, если это регистрация по email
        verification_code = None
        if not phone and email:
            verification_code = str(random.randint(100000, 999999))

        # 2. Передаем verification_code СРАЗУ внутрь create_user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password if password else None,  
            phone=phone,
            region=validated_data.get('region', ''),
            is_active=False if not phone else True,  
            verification_code=verification_code, # 🔥 Передаем сразу сюда!
        )

        # 3. Теперь спокойно запускаем Celery
        if not phone and email and verification_code:
            try:
                # Отправляем в Celery
                send_verification_email_task.delay(email, verification_code)
                print(f"🚀 [Celery Отправка] Задача на отправку кода {verification_code} добавлена в очередь для {email}")
            except Exception as e:
                print(f"❌ Ошибка при инициализации отправки через Celery: {e}")

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
    
        token['username'] = user.username
        token['email'] = user.email
        token['id'] = user.id
        token['region'] = user.region 
        token['phone'] = user.phone
        return token
    
    def validate(self, attrs):
        return super().validate(attrs)




class CustomUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["id", "username", "avatar", 'region', 'email', 'phone']




from rest_framework import serializers
from .models import FCMDevice

class FCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMDevice
        fields = ['expo_push_token']
 




class FeautereProductSerializer (serializers.ModelSerializer):
    class Meta:
        model = FeatureProduct
        fields = ['id', 'feature_template', 'feature_name',  'valueFeature']


class FeatureTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureTemplate
        fields = ['id', 'nameFeature']



class CategorySerializzer(serializers.ModelSerializer):
    feature_templates = FeatureTemplateSerializer(many=True, read_only=True)
    subcategories = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ['id', 'CategoryName', 'parent', 'subcategories', 'feature_templates']

    def get_subcategories(self, obj):
        subcategories = obj.get_all_subcategories()
        return CategorySerializzer(subcategories, many=True, context=self.context).data





class RegionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regions
        fields = '__all__'
    


class ProductReviewSerializer(serializers.ModelSerializer):   
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    reviewer_id = serializers.IntegerField(source='reviewer.id', read_only=True)
    
    
    class Meta:
        model = ProductReview
        fields = [  'reviewer_id', 'reviewer_name',
                    'comment', 'created_at','rating' ]
        read_only_fields = ['reviewer', 'created_at']

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data) 
   
class ProductImagesSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    thumb = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "thumb", "alt_text"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image_webp:
            url = obj.image_webp.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_thumb(self, obj):
        request = self.context.get("request")
        if obj.image_thumb:
            url = obj.image_thumb.url
            return request.build_absolute_uri(url) if request else url
        return None
    
    




class ProductListSerializer(serializers.ModelSerializer):
    owner_info = serializers.SerializerMethodField()
    is_bookmark = serializers.SerializerMethodField()
    product_rating = serializers.SerializerMethodField()
    product_reviews_count = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True, source='product_reviews')
    main_image = serializers.ImageField(required= False)
    
    
    class Meta:
        model = Product
        fields = ['id', 'productName', 'price', 'is_vip', 'productUser', 'address', 'dateUpdate', 'storeName', 'region'
                  , 'category', 'owner_info', 
                   'is_bookmark', 'product_rating','reviews', 
                   'product_reviews_count', 'main_image', 'main_image_webp', 
                   'main_image_thumb', 'created_at'
                    ]
        read_only_fields = ['reviewer', 'productUser']

        

    

    def get_owner_info(self, obj):
        if obj.owner:
            return {
                "id":obj.owner.id,
                'username':obj.owner.username
                
            }

  
    def get_product_rating(self, obj):
        rating = getattr(obj, "product_rating", None)
        if rating is not None:
            return round(rating, 1)
        # fallback на случай отсутствия аннотации
        agg = ProductReview.objects.filter(product=obj).aggregate(avg=Avg('rating'))
        return round(agg['avg'] or 0, 1)


    def get_product_reviews_count(self, obj):
        if not obj.owner:
            return 0
        return ProductReview.objects.filter(product=obj).count()

    
    def get_main_image(self, obj):
        request = self.context.get('request')
        if obj.main_image:  # Изменено с obj.image на obj.main_image
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return f"{settings.MEDIA_URL}{obj.main_image}"
        return None



    def get_is_bookmark(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, product=obj).exists()
        return False




class FeatureProductSerializer(serializers.ModelSerializer):
    nameFeature = serializers.CharField(source='feature_template.nameFeature',
                                        read_only=True)
    class Meta:
        model = FeatureProduct
        fields = ['id', 'feature_template', 'nameFeature', 'valueFeature']
        
class ProductDetailSerializer(serializers.ModelSerializer):
    user_phone = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    features = FeatureProductSerializer ( many=True, required=False)
    
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    owner_info = serializers.SerializerMethodField()
    is_bookmark = serializers.SerializerMethodField()
    product_rating = serializers.SerializerMethodField()
    product_reviews_count = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True, source='product_reviews')
    images = ProductImagesSerializer(many=True, read_only=True)
    main_image_webp = serializers.SerializerMethodField()
    product_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    
    class Meta:
        model = Product
        fields = (
                'id',  'storeName', 'productName', 'price', 'is_vip', 'address', 'region', 'category',
                'owner_info', 'is_bookmark', 'product_rating', 'avatar',
                'product_reviews_count', 'owner_phone',
                'reviews', 'images', 'main_image_webp', 'user_phone','productUser',
                'product_images', 'description', 'features'  # <-- product_images останется, но только для записи
            )
        extra_kwargs={
            'owner':{'read_only':True},
            'productUser':{'read_only':True},
            'main_image':{'required':False},
        }
        read_only_fields = ['reviewer', 'productUser']

    def get_user_phone(self, obj):
        if obj.productUser == 'owner' and obj.owner:
            return obj.owner.phone
        elif obj.productUser == 'user':
            return obj.user_phone
        return None

    def get_avatar(self, obj):
        request = self.context.get("request")
        if not obj.owner or not obj.owner.avatar:
            return None
        return request.build_absolute_uri(obj.owner.avatar.url)

      # Возвращаем main_image_webp (или thumb, если нет)
    def get_main_image_webp(self, obj):
        request = self.context.get('request')



        if obj.main_image_webp:
            try:
                url = obj.main_image_webp.url
                return request.build_absolute_uri(url) if request else url
            except:
                pass

        # 2) fallback: миниатюра
        if obj.main_image_thumb:
            try:
                url = obj.main_image_thumb.url
                return request.build_absolute_uri(url) if request else url
            except:
                pass

        return None


    def get_queryset(self):
        category_id = self.request.query_params.get('category')
        region_id = self.request.query_params.get('region')
        search_query = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering', 'price')

        queryset = Product.objects.all()

        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                subcategory_ids = [category.id] + [sub.id for sub in category.get_all_subcategories()]
                queryset = queryset.filter(category__id__in=subcategory_ids)
            except Category.DoesNotExist:
                return queryset.none()

        if region_id and region_id != '0':
            queryset = queryset.filter(region=region_id)

        if search_query:
            queryset = queryset.filter(productName__icontains=search_query)

        return queryset.order_by(ordering)

    def get_owner_info(self, obj):
        if obj.owner:
            return {
                "id":obj.owner.id,
                'username':obj.owner.username,
                'phone':obj.owner.phone
            }

    def create(self, validated_data):
        feature_data = validated_data.pop('features', [])
        uploaded_images = validated_data.pop('product_images', [])
        
        product = super().create(validated_data)

        request = self.context.get('request')

        # Создать изображения
        if not request.user.is_authenticated:
            for i, img in enumerate(uploaded_images):
                p_img = ProductImage.objects.create(product=product, image=img)

                # Если это первое изображение — делаем его main_image
                if i == 0:
                    product.main_image_webp = p_img.image
                    product.save(update_fields=['main_image_webp'])
        
        # Features
        for featureItem in feature_data:
            FeatureProduct.objects.create(fk_Products=product, **featureItem)

        return product


        


        


    def get_product_rating(self, obj):
        agg = ProductReview.objects.filter(product=obj).aggregate(avg=Avg('rating'))
        return round(agg['avg'], 1) if agg['avg'] is not None else None

    
    def get_product_reviews_count(self, obj):
        if not obj.owner:
            return 0
        return ProductReview.objects.filter(product=obj).count()

    def get_main_image(self, obj):
        request = self.context.get('request')
        if obj.main_image:  # Изменено с obj.image на obj.main_image
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return f"{settings.MEDIA_URL}{obj.main_image}"
        return None


    def get_is_bookmark(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, product=obj).exists()
        return False




class UserFullProfileSerializer(serializers.Serializer):
    """
    Возвращает полный профиль пользователя + товары.
    """
    user = CustomUserSerializer()
    products = ProductListSerializer(many=True)





class SellerReviewSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    # class Meta:
    #     model = SellerReview
    #     fields =  ['id', 'seller', 'reviewer', 
    #                'reviews_count','rating', 'comment', 'created_at', 'average_rating']



    def get_average_rating(self, obj):
        avg = SellerReview.objects.filter(seller=obj.seller).aggregate(avg=Avg('rating'))
        return round(avg['avg'], 1) if avg['avg'] is not None else None

    def get_reviews_count(self, obj):
        return SellerReview.objects.filter(seller=obj.seller).count()
    

class BookmarkSerializer(serializers.ModelSerializer, ):
    product = ProductListSerializer(read_only=True)
    class Meta:
        model = Bookmark
        fields = ['id', 'product', 'created_at']
class MessageRegionFileSerializer(serializers.ModelSerializer):
    """Сериализатор для оптимизированных файлов и их миниатюр с полными путями"""
    
    file = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = MessageRegionFile
        fields = [
            'id', 'file', 'thumbnail', 'type', 
            'duration', 'width', 'height'
        ]

    # 🔥 ИСПРАВЛЕНО: Добавлен request для генерации абсолютного URL
    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url # Фолбэк, если контекст не передали
        return None

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None


class MessageRegionChatSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    files = MessageRegionFileSerializer(many=True, read_only=True)
    reply_to_details = serializers.SerializerMethodField()

    class Meta:
        model = MessageRegionChat
        fields = [
            'id', 'user', 'region', 'text', 'created_at', 
            'reply_to', 'reply_to_details', 'files', 'is_read'
        ]

    def get_reply_to_details(self, obj):
        if obj.reply_to:
            first_file = obj.reply_to.files.first()
            
            file_url = None
            file_type = None
            
            if first_file:
                # Определяем относительный путь в зависимости от наличия миниатюры
                relative_url = first_file.thumbnail.url if first_file.thumbnail else first_file.file.url
                file_type = first_file.type
                
                # 🔥 ИСПРАВЛЕНО: Превращаем в абсолютный URI и внутри блока цитирования
                request = self.context.get('request')
                if request is not None:
                    file_url = request.build_absolute_uri(relative_url)
                else:
                    file_url = relative_url

            return {
                "id": obj.reply_to.id,
                "username": obj.reply_to.user.username,
                "text": obj.reply_to.text[:50],
                "file": file_url,        
                "file_type": file_type   
            }
        return None


        
class AdminsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admins
        fields = '__all__'



    
class SelectionObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionObject
        fields = '__all__'




# class MessageImageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = MessageImage
#         fields = ['id', 'image']



# class MessageSerializer(serializers.ModelSerializer):
#     images = MessageImageSerializer(many=True, read_only=True)
#     sender_name = serializers.CharField(source='sender.username', read_only=True)
#     product_name = serializers.CharField(source='product.productName', read_only=True)
#     product_image = serializers.ImageField(source='product.main_image', read_only=True)
#     is_own = serializers.SerializerMethodField()

#     class Meta:
#         model = Message
#         fields = ['id','sender', 'product_image', 'is_delivered','sender_name', 'is_own', 'images',
#                   'product_name','receiver','product','text','created_at', 'is_read']
#         read_only_fields = ['sender', 'receiver', 'created_at']

#     def get_is_own(self, obj):
#         request = self.context.get('request')
#         if request and request.user:
#             return obj.sender_id == request.user.id
#         return False



class MessageFileSerializer(serializers.ModelSerializer):
    """Сериализатор для оптимизированных файлов и их миниатюр"""
    
    # 🔥 Переопределяем поля, чтобы вручную контролировать URL
    file = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = MessageRegionFile
        fields = [
            'id', 'file', 'thumbnail', 'type', 
            'duration', 'width', 'height'
        ]

    # Единая логика для получения правильного URL
    def _get_absolute_url(self, file_url):
        if not file_url:
            return None
            
        request = self.context.get('request')
        if request:
            # Если мы в ViewSet (HTTP запрос), DRF сам подставит правильный IP
            return request.build_absolute_uri(file_url)
        
        # Если request нет (отправка через WebSocket)
        from django.conf import settings
        
        # Замени на свой актуальный IP, если BACKEND_URL не настроен в settings.py
        backend_url = getattr(settings, 'BACKEND_URL', 'http://192.168.42.241:8000') 
        
        backend_url = backend_url.rstrip('/')
        if not file_url.startswith('/'):
            file_url = f"/{file_url}"
            
        return f"{backend_url}{file_url}"

    def get_file(self, obj):
        if not obj.file:
            return None
        return self._get_absolute_url(obj.file.url)

    def get_thumbnail(self, obj):
        if not obj.thumbnail:
            return None
        return self._get_absolute_url(obj.thumbnail.url)

class MessageSerializer(serializers.ModelSerializer):
    files = MessageFileSerializer(many=True, read_only=True)
    
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    product_name = serializers.CharField(source='product.productName', read_only=True)
    
    # Рекомендую использовать .url для ImageField, если это не делается автоматически
    product_image = serializers.ImageField(source='product.main_image', read_only=True)
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 
            'sender', 
            'receiver', 
            'sender_name',    # 🔥 Теперь оно здесь, ошибка исчезнет
            'product', 
            'product_name', 
            'product_image', 
            'text', 
            'files',        # Вложенные файлы с новыми полями
            'is_delivered', 
            'is_read', 
            'is_own', 
            'created_at'
        ]
        read_only_fields = ['sender', 'receiver', 'created_at']

    def get_is_own(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_id == request.user.id
        return False



  








class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateMessageFile
        fields = ["id", "fileMessageSer", "type"]



from .services import format_last_message  # 👈 Импортируем нашу функцию

# class PrivateMessageFileSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PrivateMessageFile
#         fields = ["id", "file", "type", "duration"]



# PrivateMessageFileSerializer
class PrivateMessageFileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = PrivateMessageFile
        fields = ["id", "file", "type", "duration","thumbnail"]

    def get_file(self, obj):
        if not obj.file:
            return None
        
        request = self.context.get('request')
        if request:
            # Если мы в ViewSet, DRF сам подставит правильный IP из запроса
            return request.build_absolute_uri(obj.file.url)
        
        # Если request нет (например, вызвано из WebSocket Consumer)
        from django.conf import settings
        backend_url = getattr(settings, 'BACKEND_URL', 'http://127.0.0.1:8000')
        return f"{backend_url}{obj.file.url}"





class PrivateMessageSerializer(serializers.ModelSerializer):
    files = PrivateMessageFileSerializer(many=True, read_only=True)
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    is_own = serializers.SerializerMethodField()
    sender_avatar = serializers.ImageField(source="sender.avatar", read_only=True)
    target_avatar = serializers.ImageField(source="target.avatar", read_only=True)
    target_username = serializers.CharField(source="target.username", read_only=True)
    
     # 🔥 ОТВЕТ
    reply_to = serializers.PrimaryKeyRelatedField(
        queryset=PrivateMessage.objects.all(),
        required=False,
        allow_null=True
    )
    reply_to_data = serializers.SerializerMethodField()

    # last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = PrivateMessage
        fields = [
            "id", "text", "sender", 'target_username', "target", "sender_name",
            "files", "created_at", "is_own", "is_read", "is_delivered", "sender_avatar",
            "target_avatar",   # 🔥 reply
            "reply_to",
            "reply_to_data",

        ]


    # def get_last_message_preview(self, obj):
    #     # Используем ту самую функцию из services.py
    #     return format_last_message(obj)

    def get_is_own(self, obj):
        request = self.context["request"]
        return obj.sender == request.user

    def get_reply_to_data(self, obj):
        if not obj.reply_to:
            return None

        reply = obj.reply_to
        file = reply.files.first()

        return {
            "id": reply.id,
            "sender_id": reply.sender_id,
            "sender_username": reply.sender.username,
            "text": reply.text,
            "file_type": file.type if file else None,
            "file_url": file.file.url if file else None,
        }

    def create(self, validated_data):
       
        request = self.context["request"]

        # Достаем reply_to из валидированных данных
        reply_to = validated_data.get("reply_to", None)

        message = PrivateMessage.objects.create(
            sender=request.user,
            target=validated_data["target"],
            text=validated_data.get("text", ""),
            reply_to=reply_to  # 🔥 ВОТ ЭТОГО НЕ ХВАТАЛО
        )

        files = request.FILES.getlist("files")

        for f in files:
            content_type = f.content_type or ""

            if content_type.startswith("image/"):
                file_type = "image"
            elif content_type.startswith("video/"):
                file_type = "video"
            elif content_type.startswith("audio/"):
                file_type = "audio"
            else:
                file_type = "file"

            PrivateMessageFile.objects.create(
                message=message,
                file=f,
                type=file_type
            )

        return message

    





class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("id", "title", "description", "avatar", "is_private")

    def create(self, validated_data):
        user = self.context["request"].user

        group = Group.objects.create(
            owner=user,
            **validated_data
        )

        GroupMember.objects.create(
            group=group,
            user=user,
            role="owner"
        )

        return group





class GroupListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()  # ✅ правильно
    members_count = serializers.IntegerField(source="members.count", read_only=True)
    members_ids = serializers.SerializerMethodField()  # ✅ добавляем

    class Meta:
        model = Group
        fields = (
            "id",
            "title",
            "avatar",
            "members_count",
            "is_private",
            "last_message",
            "members_ids"
        )

    def get_members_ids(self, obj):
        return list(obj.members.values_list("user_id", flat=True))

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return {
            "text": msg.text,
            "created_at": msg.created_at,
            "sender_id": msg.sender_id,
        }



class GroupMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    avatar = serializers.ImageField(source="user.avatar")

    class Meta:
        model = GroupMember
        fields = ("id", "username", "avatar", "role")

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.user.avatar:
            return request.build_absolute_uri(obj.user.avatar.uri)

# class GroupMessageFileSerializer(serializers.ModelSerializer):
#     file = serializers.SerializerMethodField()
#     thumbnail = serializers.SerializerMethodField() # 🔥 Добавляем метод

#     class Meta:
#         model = GroupMessageFile
#         fields = ("id", "file", "type", "duration", 'thumbnail')

#     def get_file(self, obj):
#         request = self.context.get("request")
#         if obj.file:
#             if request:
#                 return request.build_absolute_uri(obj.file.url)
#             return obj.file.url
#         return None

#     # 🔥 Новый метод для получения полной ссылки на миниатюру
#     def get_thumbnail(self, obj):
#         if not obj.thumbnail:
#             return None
#         request = self.context.get("request")
#         if request:
#             return request.build_absolute_uri(obj.thumbnail.url)
#         return obj.thumbnail.url


class GroupMessageFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMessageFile
        fields = "__all__"


class GroupMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    files = GroupMessageFileSerializer(many=True, read_only=True)
    read_by_ids = serializers.PrimaryKeyRelatedField(
        many=True, source="read_by", read_only=True
    )

    read_by_users = serializers.SerializerMethodField()
   
    reply_to = serializers.PrimaryKeyRelatedField(
    queryset=GroupMessage.objects.all(),
    required=False,
    allow_null=True)

    reply_to_data = serializers.SerializerMethodField()

    reply_to_data = serializers.SerializerMethodField()

    def get_reply_to_data(self, obj):
        if not obj.reply_to:
            return None

        msg = obj.reply_to

        file = msg.files.first() if hasattr(msg, "files") else None

        request = self.context.get("request")

        file_url = None
        if file and file.file:
            if request:
                file_url = request.build_absolute_uri(file.file.url)
            else:
                file_url = file.file.url  # fallback

        return {
            "id": msg.id,
            "sender_username": msg.sender.username,
            "text": msg.text,
            "file_type": file.type if file else None,
            "file_url": file_url,
        }





    def get_read_by_users(self, obj):
        # Возвращаем список имён пользователей, которые прочитали сообщение
        return [user.username for user in obj.read_by.all()]
    
    class Meta:
        model = GroupMessage
        fields = [
            "id", "group","read_by_users", "sender", "sender_username", "text",
            "files", "created_at", "read_by_ids", 'reply_to', "reply_to_data"
        ]

        read_only_fields = ("sender", "group", "read_by")


class GroupDetailSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    members_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = ("id", "title", "avatar", "is_private", "members_count")

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class GroupUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = Group
        fields = ("title", "avatar", "is_private")

    



from moviepy.video.io.VideoFileClip import VideoFileClip

from django.conf import settings






class StoryUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ("id", "username", "avatar")

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar:
            return request.build_absolute_uri(obj.avatar.url)
        return None


import tempfile
import os
from django.conf import settings
from rest_framework import serializers

class StoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ("id", "media")


        
    def validate_video(self, media):
        max_size = settings.STORY_VIDEO_MAX_SIZE_MB * 1024 * 1024
        if media.size > max_size:
            raise serializers.ValidationError(
                f"Видео не должно превышать {settings.STORY_VIDEO_MAX_SIZE_MB} MB"
            )

        # ===== сохраняем во временный файл =====
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                for chunk in media.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            with VideoFileClip(tmp_path) as clip:
                duration = clip.duration

        except Exception as e:
            raise serializers.ValidationError("Не удалось прочитать видео")

        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

        if duration > settings.STORY_VIDEO_MAX_DURATION:
            raise serializers.ValidationError(
                f"Видео не должно быть длиннее {settings.STORY_VIDEO_MAX_DURATION} секунд"
            )
   
   
    def validate_media(self, media):
        content_type = media.content_type

        # ===== Проверка: это видео? =====
        if content_type.startswith("video"):
            self.validate_video(media)

        return media



# class StoryListSerializer(serializers.ModelSerializer):
#     media = serializers.SerializerMethodField()
#     user = StoryUserSerializer()

#     class Meta:
#         model = Story
#         fields = (
#             "id",
#             "media",
#             "created_at",
#             "expires_at",
#             "user",
#         )

#     def get_media(self, obj):
#         request = self.context.get("request")
#         if obj.media:
#             return request.build_absolute_uri(obj.media.url)
#         return None



# class StoryListSerializer(serializers.ModelSerializer):
#     media = serializers.SerializerMethodField()
#     user = StoryUserSerializer()

#     class Meta:
#         model = Story
#         fields = ("id", "media", "created_at", "expires_at", "user")

#     def get_media(self, obj):
#         request = self.context.get("request")
#         if obj.media:
#             return request.build_absolute_uri(obj.media.url)
#         return None



class StoryListSerializer(serializers.ModelSerializer):
    media = serializers.SerializerMethodField()
    user = StoryUserSerializer()
    is_viewed = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ("id", "media", "created_at", "expires_at", "user", "is_viewed")

    def get_media(self, obj):
        request = self.context.get("request")
        if obj.media:
            return request.build_absolute_uri(obj.media.url)
        return None

    def get_is_viewed(self, obj):
        user = self.context["request"].user
        return obj.views.filter(user=user).exists()






from rest_framework import serializers
from .models import StoryView

from django.conf import settings

# твои импорты моделей...

class StoryViewerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = StoryView
        fields = ("id", "username", "avatar", "viewed_at")

    def get_avatar(self, obj):
        avatar = obj.user.avatar

        if not avatar:
            return None

        # 1. Пытаемся взять URL из настроек
        backend_url = getattr(settings, 'BACKEND_URL', None)
        if backend_url:
            # rstrip('/') убирает слеш на конце, чтобы не получилось http://...//media/...
            return f"{backend_url.rstrip('/')}{avatar.url}"

        # 2. Фолбэк: если BACKEND_URL не задан, используем стандартный метод
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(avatar.url)

        return avatar.url


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ("id", "follower", "following", "created_at")
        read_only_fields = ("follower",)
