from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from .models import Admins, Product,ProductReview, ProductImage, Bookmark, Message, SelectionObject, Regions, Category, FeatureProduct, CustomUser
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count;
from django.utils.timezone import localtime
from zoneinfo import ZoneInfo


User = get_user_model()


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
    









class CategorySerializzer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ['id', 'CategoryName', 'parent', 'subcategories']

    def get_subcategories(self, obj):
        subcategories = obj.get_all_subcategories()
        return CategorySerializzer(subcategories, many=True, context=self.context).data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone', 'region')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username = validated_data['username'],
            email = validated_data.get('email'),
            password = validated_data['password'],
            phone = validated_data['phone'],
            region = validated_data['region'],
        )
        return user 



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

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']





class ProductListSerializer(serializers.ModelSerializer):
    owner_info = serializers.SerializerMethodField()
    is_bookmark = serializers.SerializerMethodField()
    product_rating = serializers.SerializerMethodField()
    product_reviews_count = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True, source='product_reviews')
    main_image = serializers.ImageField(required= False)
   
    
    class Meta:
        model = Product
        fields = ['id', 'productName', 'price', 'productUser', 'address', 'dateUpdate', 'storeName', 'region'
                  , 'category', 'owner_info', 
                   'is_bookmark', 'product_rating','reviews', 
                   'product_reviews_count', 'main_image',
                    ]
        read_only_fields = ['reviewer', 'productUser']

        

    # def create (self, validated_data):
    #     # uploaded_images = validated_data.pop('product_images',[])
    #     main_image = validated_data.pop('main_image', None)
    #     product = super().create(validated_data)

    #     if main_image:
    #         product.main_image = main_image
    #         product.save(update_fields=['main_image'])

    #     # for img in uploaded_images:
    #     #     ProductImage.objects.create(product = product, image = img)
    #     return product 
        

    def get_owner_info(self, obj):
        if obj.owner:
            return {
                "id":obj.owner.id,
                'username':obj.owner.username
                
            }

    # def create (self, validated_data):
    #     uploaded_images = validated_data.pop('product_images',[])
    #     product = super().create(validated_data)

    #     for img in uploaded_images:
    #         ProductImage.objects.create(product = product, image = img)
    #     return product 
        


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










class ProductDetailSerializer(serializers.ModelSerializer):
    owner_info = serializers.SerializerMethodField()
    is_bookmark = serializers.SerializerMethodField()
    product_rating = serializers.SerializerMethodField()
    product_reviews_count = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True, source='product_reviews')
    images = ProductImagesSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    product_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs={
            'owner':{'read_only':True},
            'productUser':{'read_only':True},
            'main_image':{'required':False},
        }
        read_only_fields = ['reviewer', 'productUser']


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

    def create (self, validated_data):
        uploaded_images = validated_data.pop('product_images',[])
        product = super().create(validated_data)

        for img in uploaded_images:
            ProductImage.objects.create(product = product, image = img)
        return product 
        
    # def update(self, instance, validated_data):
    #     uploaded_images = validated_data.pop('product_images', [])
    #     for attr, value in validated_data.items():
    #         setattr(instance, attr, value)
    #     instance.save()
    #     for img in uploaded_images:
    #         ProductImage.objects.create(product=instance, image=img)
    #     return instance    


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


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    product_name = serializers.CharField(source='product.productName', read_only=True)
    product_image = serializers.ImageField(source='product.main_image', read_only=True)
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id','sender', 'product_image','sender_name', 'is_own',
                  'product_name','receiver','product','text','created_at', 'is_read']
        read_only_fields = ['sender', 'receiver', 'created_at']

    def get_is_own(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_id == request.user.id
        return False
    


class FeatureProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureProduct
        fiels = '__all__'

    


class AdminsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admins
        fields = '__all__'



    
class SelectionObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionObject
        fields = '__all__'


