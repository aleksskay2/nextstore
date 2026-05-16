from calendar import c

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from django.db.models import Q, Max, Count, When, IntegerField, Case, F, OuterRef, Exists, Subquery
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import status
from rest_framework.filters import SearchFilter
from .serializers import RegisterSerializer

from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render

from django.db.models import Avg, Q
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models.functions import Coalesce

from rest_framework.exceptions import ValidationError
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.cache import cache
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.response import Response
from .throttles import ResendActivationRateThrottle

from django.contrib.auth import get_user_model
from .utils import send_activation_email
import logging

from django.db.models import Avg, Case, When, Value, IntegerField, FloatField, F
from django.contrib.postgres.search import TrigramSimilarity
from .pagination import RegionChatPagination

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, permissions, serializers
from .models import  PrivateMessage, MessageRegionFile, Admins, MessageFile, Product, Message, MessageRegionChat, FeatureTemplate, ProductImage, ProductReview, Bookmark,SelectionObject, Regions, Category, FeatureProduct, CustomUser
from .models import Group, GroupMember,  GroupMessage, GroupMessageFile, Follow
from .models import Story, StoryView
from .serializers import AdminsSerializer, StoryViewerSerializer, MessageRegionChatSerializer,  FollowSerializer, GroupUpdateSerializer,GroupDetailSerializer, CustomUserSerializer, GroupCreateSerializer, GroupListSerializer, PrivateMessageSerializer, FeatureTemplateSerializer, ProductListSerializer, ProductDetailSerializer, ProductImagesSerializer, ProductReviewSerializer, MessageSerializer, BookmarkSerializer,  SelectionObjectSerializer, RegionsSerializer
from .serializers import GroupMemberSerializer
from .serializers import StoryCreateSerializer, StoryListSerializer
from .serializers import (
    CategorySerializzer,
    FeatureProductSerializer,
   
)


# Create your views here.


def index(request): 
       return render(request,'index.html')

User = get_user_model()

logger = logging.getLogger(__name__)

DEFAULT_RESEND_COOLDOWN = getattr(settings, 'DEFAULT_RESEND_COOLDOWN', 300)

class ResendActivationView(APIView):
    throttle_classes = [ResendActivationRateThrottle]
    
    def post (self, request):
        email = (request.data.get('email') or "").strip().lower()
        if not email:
            return Response({"detail":"Укажите email"}, status=status.HTTP_400_BAD_REQUEST)
        
        cache_key = f"resend_activation_{email}"
        cooldown = DEFAULT_RESEND_COOLDOWN

        #Если недавно уже отправляли (или пытались), не шлем снова
        if cache.get(cache_key):
            #возвращаем generic сообщение(200) -клиент не узнает, был ли email найден
            return Response({'detail':"Если аккаунт существует, письмо отправлено."}, status=status.HTTP_200_OK)

        cache.set(cache_key, True, timeout=cooldown)
        try:
            user = user.objects.get(email__iexact=email)
        except User.DoesNotExist:
            logging.info("Resend activation requested for unknown email: %s", email)
            return Response({'detail', "Если аккаунт существует, письмо отправлено."}, 
                            status= status.HTTP_200_OK)

        #Если уже активирован - просто возращаем generic(без пояснений)
        if user.is_active:
            logger.info("Resend activation requested but user already active:%s ", email)
            return Response({'detail': "Если аккаунт существует, письмо отправлено."},
                            status=status.HTTP_200_OK)

        #Все ок - отправляем письмо (рекомендуется сделать асинхронным, пример ниже)
        try:
            #Синхронно
            send_activation_email(user)

            #Или асинхронно (Celery):send_activation_email_task_delay(user.pk)
        except Exception as e:
            logger.exception('Error while sending activation email to %s:%s', email, e)
            
            #Не раскрываем детали ошибки клиенту
            return Response({'detail':"Если аккаунт существует, письмо отправлено."}, status=status.HTTP_200_OK)
        return Response({'detail':"Если аккаунт существует, письмо отправлено."}, status=status.HTTP_200_OK)

class ActivateAccountView(APIView):
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        if not uidb64 or not token:
            return Response({'detail':'UID и token обязательны'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail':'Неверная ссылка активации'},
                             status=status.HTTP_400_BAD_REQUEST)

        if user.is_active:
            return Response({'detail':'Пользователь уже активирован.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'detail':'Аккаунт успешно активирован!'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail':'Неверный или просроченный токен'}, status=status.HTTP_400_BAD_REQUEST)



class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer

    @action(detail=False, methods=["post"], url_path="upload-avatar")
    def upload_avatar(self, request):
        user = request.user
        file = request.FILES.get("avatar")

        if not file:
            return Response({"error": "Файл не передан"}, status=400)

        user.avatar = file
        user.save()


        return Response({"avatar": request.build_absolute_uri( user.avatar.url)}, status=200)
    
    @action(detail=True, methods=['get'], url_path='edit')
    def edit(self, request, pk=None):
        """
        Возвращает профиль пользователя по id.
        
        Пример запроса: /users/{pk}/edit/
        """
        user = get_object_or_404(User, pk=pk)
        serialized_data = CustomUserSerializer(user).data
        return Response(serialized_data, status=200)



    @action(detail=False, methods=["patch"], url_path="update-profile")
    def update_profile(self, request):
        user = request.user

        # 🔹 Получаем данные
        username = request.data.get("username")
        region = request.data.get("region")
        phone = request.data.get("phone")
        email = request.data.get("email")
        avatar = request.FILES.get("avatar")


        # 🔹 Обновляем только те поля, которые переданы
        if username:
            user.username = username

        if region:
            user.region = region

        if phone:
            user.phone = phone

        if email:
            user.email = email

        if avatar:
            user.avatar = avatar

        user.save()

        return Response({
            "status": "success",
            "user": CustomUserSerializer(user).data
        }, status=200)   



from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FCMDevice
from .serializers import FCMDeviceSerializer

class FCMDeviceViewSet(viewsets.ModelViewSet):
    queryset = FCMDevice.objects.all()
    serializer_class = FCMDeviceSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # 1. Достаем токен напрямую, минуя строгую проверку сериализатора на уникальность
        token = request.data.get('expo_push_token')

        if not token:
            return Response(
                {"error": "Поле expo_push_token обязательно."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Обновляем, если токен есть, иначе создаем
        device, created = FCMDevice.objects.update_or_create(
            expo_push_token=token,
            defaults={'user': request.user}
        )

        # 3. Возвращаем правильный статус
        # Если создали — 201 Created. Если просто обновили владельца — 200 OK.
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(
            {"status": "success", "message": "Токен сохранен", "created": created},
            status=response_status
        )


    def get_queryset(self):
        # Хорошая практика: показывать пользователю только его устройства
        return self.queryset.filter(user=self.request.user)





# class UserFullProfileView(APIView):
#     def get(self, request, user_id):
#         # 1. Пользователь
#         user = get_object_or_404(User, id=user_id)
#         user_data = CustomUserSerializer(user, context={"request": request}).data

#         # 2. Товары пользователя
#         products = Product.objects.filter(owner_id=user_id, productUser='owner')
#         product_data = ProductDetailSerializer(products, many=True, context={"request": request}).data

#         # 3. Ответ
#         return Response({
#             "user": user_data,
#             "products": product_data
#         }, status=200)





from store.utils import invalidate_user_cache

class UpdateUserView(APIView):
    def put(self, request):
        user = request.user
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        invalidate_user_cache(user.id)
        return Response(serializer.data)
    
class ProductUpdateView(APIView):
    def put(self, request, pk):
        product = Product.objects.get(id=pk)
        serializer = ProductListSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        invalidate_user_cache(product.owner_id)
        return Response(serializer.data)


class UserFullProfileView(APIView):
    def get(self, request, user_id):
        cache_key = f"user_full_profile:{user_id}"

        # --- 1) ПРОБА КЭША ---
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=200)

        # --- 2) ДЕЛАЕМ ЗАПРОСЫ К БД ---
        user = get_object_or_404(User, id=user_id)
        user_data = CustomUserSerializer(user, context={"request": request}).data

        products = Product.objects.filter(owner_id=user_id, productUser='owner')
        product_data = ProductListSerializer(
            products, many=True, context={"request": request}
        ).data

        payload = {
            "user": user_data,
            "products": product_data
        }

        # --- 3) КЭШИРУЕМ НА 60 СЕК ---
        cache.set(cache_key, payload, timeout=60)

        return Response(payload, status=200)








class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id':user.id,
            'username':user.username,
            'email':user.email
        })



class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



class SearchUserViewSet(viewsets.ModelViewSet):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """Обрабатывает GET-запросы на поиск пользователей."""
        q = self.request.query_params.get('q', '').strip()
        
        if not q:
            return Response([])

        queryset = (
            User.objects
                .filter(Q(username__icontains=q) | Q(email__icontains=q))
                .exclude(id=self.request.user.id)
                .only("id", "username", "avatar")  # используем only для оптимизации выборки
        )

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Преобразуем абсолютные урлы для аватаров вручную
        for item in data:
            if 'avatar' in item and item['avatar']:
                item['avatar'] = request.build_absolute_uri(item['avatar'])

        return Response(data)



class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProductVipViewSet(viewsets.ModelViewSet):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(is_vip=True).order_by('dateUpdate')




class MyProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter( owner = self.request.user,
                                       productUser = 'owner')
    
  





class AdminsViewSet(viewsets.ModelViewSet):
    queryset = Admins.objects.all()
    serializer_class = AdminsSerializer


class ProductPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


class CategoryFeaturesView(APIView):
    def get(self, request, category_id):
        templates = FeatureTemplate.objects.filter(category_id=category_id)
        serializer = FeatureTemplateSerializer(templates, many=True)
        return Response(serializer.data)


class FeatureTemplateByCategoryView(generics.ListAPIView):
    serializer_class = FeatureTemplateSerializer,

    def get_queryset(self):
        category_id = self.kwargs['category_id']
        return FeatureTemplate.objects.filter(category_id=category_id)


from rest_framework.exceptions import NotAuthenticated

class ProductUserViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['productName',  'price', 'address','region__nameRegions']
    pagination_class = ProductPagination
    ordering_fields = ['price', 'product_rating','created_at']
    filterset_fields = ['region']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        productUser = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')  # <— ловим параметр сортировки
        price_min = self.request.query_params.get('min_price')
        price_max = self.request.query_params.get('max_price')
        queryset = Product.objects.all()

        # 🔥 Оставили фильтр только для владельцев, убрали 'user'
        if productUser == 'owner':
            queryset = queryset.filter(productUser=productUser)

        # фильтр по категории
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                subcategories = category.get_all_subcategories()
                all_category_ids = [category.id] + [sub.id for sub in subcategories]
                queryset = queryset.filter(category_id__in=all_category_ids)
            except Category.DoesNotExist:
                pass

        if price_min:
                queryset = queryset.filter(price__gte=price_min)

        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        # ✅ Аннотация рейтинга (NULL → 0)
        queryset = queryset.annotate(
            product_rating=Coalesce(
                Avg('product_reviews__rating'),
                Value(0.0),
                output_field=FloatField()
            )
        )

        # Поиск
        if search:
            search = search.lower()

            queryset = queryset.annotate(
                similarity=(
                    TrigramSimilarity('productName', search) +
                    TrigramSimilarity('address', search) +
                    TrigramSimilarity('region__nameRegions', search)
                )
            ).filter(similarity__gt=0.2).order_by('-similarity')
        else:
            # ✅ Обработка сортировки по дате и рейтингу
            if ordering == '-product_rating':
                queryset = queryset.order_by(F('product_rating').desc())
            elif ordering == 'product_rating':
                queryset = queryset.order_by(F('product_rating').asc())
            elif ordering == '-created_at':
                queryset = queryset.order_by('-created_at') # Сначала новые
            elif ordering == 'created_at':
                queryset = queryset.order_by('created_at') # Сначала старые
            else:
                # Сортировка по умолчанию (по дате создания)
                # Исправил опечатку: '-created' на '-created_at' (судя по твоему ordering_fields)
               queryset = queryset.order_by(F('created_at').desc(nulls_last=True))
                    
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        
        # 🔥 Блокируем создание товара неавторизованными пользователями на уровне API
        if not user.is_authenticated:
            raise NotAuthenticated("Только зарегистрированные пользователи могут добавлять товары.")
            
        # Сохраняем товар строго с привязкой к владельцу
        product = serializer.save(owner=user, productUser='owner')
        
        main_image = self.request.FILES.get('main_image')
        if main_image:
            product.main_image = main_image
            product.save()

        print("FEATURES RAW:", self.request.data.get('features'))
        features_data = self.request.data.get('features',[])
        
        if isinstance(features_data, str):
            import json
            try:
                features_data = json.loads(features_data)
            except json.JSONDecodeError:
                features_data = []

        for feature in features_data:
            feature_template_id = feature.get('feature_template')
            value = feature.get('valueFeature')    
            if feature_template_id and value:
                FeatureProduct.objects.create(
                    product=product,
                    feature_template_id=feature_template_id,
                    valueFeature=value
                )
                
        return product
        
        # uploaded_images = self.request.FILES.getlist('product_images')
        # for img in uploaded_images:
        #     ProductImage.objects.create(product=product, image=img)
        #     product.save()


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    # def list(self, request):
    #     bookmarks = Bookmark.objects.filter(user=request.user)
    #     serializer = BookmarkSerializer(bookmarks, many=True)
    #     return Response(serializer.data)


    @action(detail=False, methods=['post'], url_path='add')
    def add__bookmark(self, request):
        product_id = request.data.get('product')
        try:
            product = Product.objects.get(id=product_id)
            bookmark, created = Bookmark.objects.get_or_create(
                user=request.user,
                product=product
            )
            if not created:
                return Response({'message':'Уже в избранном'}, status=status.HTTP_200_OK)
            return Response({'message':'Добавлено в избранное'}, status=status.HTTP_201_CREATED)
        except Product.DoesNotExist:
            return Response({'error':'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    # @action(detail=False, methods=['delete'], url_path=r'remove(?P<pk>\d+)') 
    @action(detail=False, methods=['delete'], url_path=r'remove/(?P<pk>\d+)')
    def remove_bookmark(self, request, pk=None):
        try:
            book = Bookmark.objects.get(user=request.user, product_id=pk)
            book.delete()
            # 🔥 Убрали словарь, оставили только статус 204
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Bookmark.DoesNotExist:
            return Response({'error':'Не найдено в избранном'}, status=status.HTTP_404_NOT_FOUND)



    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(user = self.request.user)






class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Добавляем prefetch_related('files'), чтобы не было N+1 запросов при получении файлов
        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver', 'product')\
         .prefetch_related('files')\
         .order_by('-created_at')

    def perform_create(self, serializer):
        product = serializer.validated_data.get('product')
        if not product:
            raise serializers.ValidationError('Товар обязателен')
            
        receiver = product.owner
        if receiver == self.request.user:
            raise serializers.ValidationError('Нельзя писать сообщение самому себе')
            
        serializer.save(sender=self.request.user, receiver=receiver)

    @action(detail=False, methods=['post'], url_path='mark_as_read')
    def mark_as_read(self, request):
        user = request.user
        product_id = request.data.get('product_id')
        sender_id = request.data.get('sender_id')

        updated = Message.objects.filter(
            sender_id=sender_id,
            receiver=user,
            product_id=product_id,
            is_read=False,
        ).update(is_read=True)

        return Response({'updated': updated})

    @action(detail=False, methods=['get'], url_path=r'dialog/(?P<user1_id>\d+)/(?P<user2_id>\d+)/(?P<product_id>\d+)')
    def dialog(self, request, user1_id=None, user2_id=None, product_id=None):
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        qs = Message.objects.filter(
            Q(sender_id=user1_id, receiver_id=user2_id, product_id=product_id) |
            Q(sender_id=user2_id, receiver_id=user1_id, product_id=product_id)
        ).prefetch_related('files').order_by('-created_at')

        total_count = qs.count()
        # Пагинация и разворот для правильного порядка в чате
        messages = list(qs[offset:offset+limit][::-1])
        serializer = self.get_serializer(messages, many=True)

        return Response({
            "messages": serializer.data,
            "total": total_count,
        })

    @action(detail=False, methods=['get'], url_path='chats')
    def chats(self, request):
        user_id = request.user.id

        # Группируем сообщения по товару и собеседнику
        dialogs = (
            Message.objects
            .filter(Q(sender_id=user_id) | Q(receiver_id=user_id))
            .annotate(
                companion_id=Case(
                    When(sender_id=user_id, then=F('receiver_id')),
                    default=F('sender_id'),
                    output_field=IntegerField()
                )
            )
            .values('product_id', 'companion_id')
            .annotate(
                last_message_id=Max('id'),
                unread_count=Count(
                    'id',
                    filter=Q(receiver_id=user_id, is_read=False)
                )
            )
        )

        last_ids = [d['last_message_id'] for d in dialogs if d['last_message_id']]
        last_messages = (
            Message.objects.filter(id__in=last_ids)
            .select_related('product', 'sender', 'receiver')
            .prefetch_related('files')
        )
        messages_map = {m.id: m for m in last_messages}

        response_data = []
        for d in dialogs:
            msg = messages_map.get(d['last_message_id'])
            if msg:
                # Формируем текст последнего сообщения (текст или тип файла)
                last_text = msg.text
                if not last_text and msg.files.exists():
                    f_type = msg.files.first().type
                    types_map = {"image": "📷 Фото", "video": "🎥 Видео", "audio": "🎤 Голос"}
                    last_text = types_map.get(f_type, "📎 Файл")

                response_data.append({
                    # 🔥 Тот самый стабильный ID для фронтенда
                    'id': f"product_{d['product_id']}_{d['companion_id']}",
                    'type': 'product',
                    'product_id': d['product_id'],
                    'product_name': msg.product.productName if msg.product else "Товар",
                    'avatar': request.build_absolute_uri(msg.product.main_image_webp.url) if msg.product and msg.product.main_image_webp else None,
                    'companion_id': d['companion_id'],
                    'last_message': last_text,
                    'last_message_at': msg.created_at,
                    'unread_count': d['unread_count'],
                })

        response_data.sort(key=lambda x: x['last_message_at'], reverse=True)
        return Response(response_data)

    @action(detail=False, methods=['post'], url_path='send')
    def send_message(self, request):
        receiver_id = request.data.get('receiver_id')
        product_id = request.data.get('product')
        text = request.data.get('text', '')
        
        uploaded_files = request.FILES.getlist('files') or request.FILES.getlist('images')

        # Создаем сообщение
        message = Message.objects.create(
            sender=request.user,
            receiver_id=receiver_id,
            product_id=product_id,
            text=text
        )

        # Создаем файлы
        import mimetypes
        for file_obj in uploaded_files:
            mime_type, _ = mimetypes.guess_type(file_obj.name)
            if mime_type and mime_type.startswith("audio"):
                f_type = "audio"
            elif mime_type and mime_type.startswith("video"):
                f_type = "video"
            else:
                f_type = "image"

            MessageFile.objects.create(
                message=message,
                file=file_obj,
                type=f_type
                # duration и thumbnail подтянутся в .save() модели MessageFile
            )

        # Подгружаем связанные данные для сериализации
        message = Message.objects.prefetch_related('files').get(pk=message.pk)
        serialized = MessageSerializer(message, context={'request': request}).data

        # 🔥 Отправляем в WebSocket (используем стабильный chat_id в обертке, если нужно)
        channel_layer = get_channel_layer()
        chat_id = f"product_{product_id}_{request.user.id if str(request.user.id) != str(receiver_id) else receiver_id}"
        
        # Добавляем ID чата в данные для сокета, чтобы фронт знал, какой чат обновить
        socket_data = {
            **serialized,
            "chat_id": chat_id 
        }

        async_to_sync(channel_layer.group_send)(
            f"product_chat_{product_id}",
            {
                "type": "new_message",
                "message": socket_data,
            }
        )
    
        return Response(serialized, status=status.HTTP_201_CREATED)








User = get_user_model()
class ProductReviewViewSet(viewsets.ModelViewSet):
   
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def list (self, request):
        product_id = request.query_params.get('product')
        if product_id:
            reviews = ProductReview.objects.filter(product_id=product_id)
            serializer = ProductReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        return Response({'error':"Не указан product_id"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], 
            url_path=r'(?P<product_id>\d+)/add_review')
    def add_review(self, request, product_id=None):
        try:
            product = get_object_or_404 (Product, id=product_id)
        except product.DoesNotExist:
            return Response({"error": "Нет товара"}, status=status.HTTP_404_NOT_FOUND)

        if product.owner == request.user:
            return Response({"error": "Нельзя оставить отзыв самому себе"}, status=status.HTTP_403_FORBIDDEN)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not rating or int(rating) not in range(1, 6):
            return Response({"error": "Рейтинг должен быть от 1 до 5"}, status=status.HTTP_400_BAD_REQUEST)

        review, created = ProductReview.objects.update_or_create(
            product=product,
            reviewer=request.user,
            defaults={'rating': rating, 'comment': comment}
        )

        return Response(ProductReviewSerializer(review).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class DeleteUserProductView(APIView):
    permission_classes = []

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, productUser='user')
            product.delete()
            return Response({'detail':'Товар удален'}, status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response({'detail':'Товар не найден или нельзя его удалить!'},
                             status=status.HTTP_404_NOT_FOUND)



# class OwnerProductViewSet(viewsets.ModelViewSet):
#     queryset = Product.objects.filter(productUser = 'owner')
#     serializer_class = ProductDetailSerializer
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser]

#     # def get_queryset(self):
#     #     return Product.objects.filter(owner=self.request.user, productType='owner')
    
#     def perform_create(self, serializer ):
#         product = serializer.save(owner=self.request.user, productUser='owner')

        
#         # Работаем с файлами после сохранения
#         main_image = self.request.FILES.get('main_image')
#         if main_image:
#             product.main_image = main_image
#             product.save()

#         uploaded_images = self.request.FILES.getlist('product_images')
#         if uploaded_images:
#             for img in uploaded_images:
#                 ProductImage.objects.create(product=product, image=img)

#         if not main_image:
#             product.main_image = uploaded_images[0]
#             product.save()


#         features_data = self.request.data.get('features',[])
#         if isinstance(features_data, str):
#             import json
#             try:
#                 features_data = json.loads(features_data)
#             except json.JSONDecodeError:
#                 features_data = []

#             for feature in features_data:
#                 feature_template_id = feature.get('feature_template')
#                 value = feature.get('valueFeature')    
#                 if feature_template_id and value:
#                     FeatureProduct.objects.create(
#                         product=product,
#                         feature_template_id =feature_template_id,
#                         valueFeature=value
#                     )
#             return product
        
#     @action(detail=False, methods=['get'], url_path='by-user/(?P<user_id>[^/.]+)')
#     def get_products_by_user(self, request, user_id = None):
#         # получить товары конкретного продавца
#         products = Product.objects.filter(owner_id = user_id, productUser='owner')
#         serializer = self.get_serializer(products, many=True)
#         return Response(serializer.data)


#     def update(self, request, *args, **kwargs):
#         partial = kwargs.pop('partial', False)
#         instance = self.get_object()

#         serializer = self.get_serializer(instance, data=request.data, partial=partial)
#         serializer.is_valid(raise_exception=True)
#         self.perform_update(serializer)

#         main_image_webp = request.FILES.get('main_image_webp')
#         if  main_image_webp:
#             instance.main_image_webp =  main_image_webp
#             instance.save()
        

#         uploaded_images = request.FILES.getlist('product_images')
#         if uploaded_images:
#             instance.images.all().delete()

#             for img in uploaded_images:
#                 ProductImage.objects.create(product=instance, image=img)
        
#             if not main_image_webp:
#                 instance.main_image_webp = uploaded_images[0]
#                 instance.save()

#         features_data = request.data.get('features')
#         if features_data:
#             import json
#             try:
#                 features = json.loads(features_data) if isinstance(features_data, str) else features_data
#                 instance.features.all().delete()
#                 for f in features:
#                     FeatureProduct.objects.create(
#                         product=instance,
#                         feature_template_id = f.get('feature_template'),
#                         valueFeature = f.get('valueFeature', '')
#                     )
#             except Exception as e:
#                 print('Ошибка при обновлении харектеристик',e)

#         return Response(self.get_serializer(instance).data)


class OwnerProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(productUser='owner')
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # Рекомендуется фильтровать по текущему юзеру, чтобы он не мог править чужие товары
        return Product.objects.filter(owner=self.request.user, productUser='owner')

    def perform_create(self, serializer):
        product = serializer.save(owner=self.request.user, productUser='owner')
        self._handle_files_and_features(product, self.request)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Выносим логику обработки файлов и характеристик в отдельный метод
        self._handle_files_and_features(instance, request, is_update=True)

        return Response(self.get_serializer(instance).data)

    def _handle_files_and_features(self, product, request, is_update=False):
        # 1. Обработка характеристик (логика общая для create и update)
        features_data = request.data.get('features')
        if features_data:
            try:
                features = json.loads(features_data) if isinstance(features_data, str) else features_data
                if is_update:
                    product.features.all().delete()
                
                for f in features:
                    FeatureProduct.objects.create(
                        product=product,
                        feature_template_id=f.get('feature_template'),
                        valueFeature=f.get('valueFeature', '')
                    )
            except Exception as e:
                print('Ошибка при обработке характеристик:', e)

        # 2. Обработка главного изображения
        # В PATCH мы отправляем main_image_webp (как в коде RN)
        main_image = request.FILES.get('main_image_webp') or request.FILES.get('main_image')
        
        if main_image:
            product.main_image_webp = main_image
            product.save()

        # 3. Обработка дополнительных изображений
        uploaded_images = request.FILES.getlist('product_images')
        if uploaded_images:
            if is_update:
                product.images.all().delete()

            for img in uploaded_images:
                # Чтобы не было ошибки "closed file", если мы захотим использовать файл снова,
                # можно вызвать img.seek(0), но здесь мы просто создаем объект.
                ProductImage.objects.create(product=product, image=img)

            # Если главного фото нет, назначаем первое из дополнительных
            if not product.main_image_webp:
                first_img = uploaded_images[0]
                # ВАЖНО: возвращаем указатель в начало файла, так как он был вычитан при создании ProductImage
                first_img.seek(0) 
                product.main_image_webp = first_img
                product.save()

    @action(detail=False, methods=['get'], url_path='by-user/(?P<user_id>[^/.]+)')
    def get_products_by_user(self, request, user_id=None):
        products = Product.objects.filter(owner_id=user_id, productUser='owner')
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)






class EditUserProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(productUser = 'user')
    serializer_class = ProductDetailSerializer
    parser_classes = [MultiPartParser, FormParser]

   
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

          # Обновляем главное изображение
        main_image = request.FILES.get('main_image')
        if main_image:
            instance.main_image = main_image
            instance.save()



        uploaded_images = request.FILES.getlist('product_images')
        if uploaded_images:
            instance.images.all().delete()

            for img in uploaded_images:
                ProductImage.objects.create(product=instance, image=img)

        features_data = request.data.get('features')
        if features_data:
            import json
            try:
                features = json.loads(features_data) if isinstance(features_data, str) else features_data
                instance.features.all().delete()
                for f in features:
                    FeatureProduct.objects.create(
                        product=instance,
                        feature_template_id = f.get('feature_template'),
                        valueFeature = f.get('valueFeature', '')
                    )
            except Exception as e:
                print('Ошибка при обновлении харектеристик',e)
        return   Response(self.get_serializer(instance).data)
            



        
        return Response(self.get_serializer(instance).data)





class SelectionObjectViewSet(viewsets.ModelViewSet):
    queryset = SelectionObject.objects.all()
    serializer_class = SelectionObjectSerializer


class RegionsViewSet(viewsets.ModelViewSet):
    queryset = Regions.objects.all()
    serializer_class = RegionsSerializer
    


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializzer



class FeatureProductViewSet(viewsets.ModelViewSet):
    queryset = FeatureProduct.objects.all()
    serializer_class = FeatureProductSerializer



from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import NotFound





    


      



from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class PrivateMessageViewSet(viewsets.ModelViewSet):
    # permission_classes = [IsAuthenticated]
    serializer_class = PrivateMessageSerializer
  

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = PrivateMessage.objects.filter(
            target=request.user,
            is_read=False
        ).count()
        return Response({"unread": count})


    def get_queryset(self):
        # 👇 для удаления по pk — даём полный доступ
        if self.action == "delete_for_all":
            return PrivateMessage.objects.all()

        user = self.request.user
        target = self.request.query_params.get("target")

        if not target:
            return PrivateMessage.objects.none()

        limit = int(self.request.query_params.get("limit", 20))
        offset = int(self.request.query_params.get("offset", 0))

        base_qs = PrivateMessage.objects.filter(
            Q(sender=user, target_id=target) |
            Q(sender_id=target, target=user)
        ).order_by("-created_at")

        qs = base_qs[offset: offset + limit]
        return qs[::-1]

        

    @action(detail=True, methods=["POST"], url_path="confirm-download")
    def confirm_download(self, request, pk=None):
        try:
            message = PrivateMessage.objects.get(pk=pk)
        except PrivateMessage.DoesNotExist:
            return Response({"detail": "Сообщение не найдено"}, status=status.HTTP_404_NOT_FOUND)

        # Только получатель может подтвердить, что он скачал файлы
        if message.target != request.user:
            return Response(
                {"detail": "Только получатель может подтвердить загрузку"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Проходимся по всем файлам сообщения, которые еще не скачаны
        files = message.files.filter(is_downloaded=False)
        for msg_file in files:
            msg_file.is_downloaded = True
            if msg_file.file:
                # Физически удаляем файл с жесткого диска сервера
                msg_file.file.delete(save=False) 
                msg_file.file = None # Очищаем путь в БД
            msg_file.save(update_fields=["is_downloaded", "file"])

        return Response({"detail": "Файлы успешно удалены с сервера"}, status=status.HTTP_200_OK)


    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)

        message = (
            PrivateMessage.objects
            .prefetch_related("files")
            .get(id=message.id)
        )

        channel_layer = get_channel_layer()
        data = self.get_serializer(message).data

        async_to_sync(channel_layer.group_send)(
            f"chat_{message.target.id}",
            {
                "type": "chat_message",
                "message": data
            }
        )

        async_to_sync(channel_layer.group_send)(
            f"chat_{message.sender.id}",
            {
                "type": "chat_message",
                "message": data
            }
        )






    @action(detail=False, methods=["GET"], url_path="unread-list")
    def unread_list(self, request):
        """
        Возвращает список пользователей, которые отправили непрочитанные сообщения
        формата:
        [
          { "user_id": 7, "username": "petr", "unread_count": 3 }
        ]
        """
        user = request.user

        qs = (
            PrivateMessage.objects
            .filter(target=user, is_read=False)
            .values("sender_id", "sender__username")
            .annotate(unread_count=Count("id"))
        )

        result = [
            {
                "user_id": item["sender_id"],
                "username": item["sender__username"],
                "unread_count": item["unread_count"]
            }
            for item in qs
        ]

        return Response(result)
    

    

    
    @action(detail=False, methods=["GET"], url_path="unread-total")
    def unread_total(self, request):
        user = request.user
        
        private_unread = PrivateMessage.objects.filter(
            target=user,
            is_read=False
        ).count()

        product_unread = Message.objects.filter(
            receiver=user,
            is_read=False
        ).count()

        return Response({
            "private_unread": private_unread,
            "product_unread": product_unread,
            "total_unread": private_unread + product_unread
        })



    @action(detail=False, methods=["GET"], url_path="unread-summary")
    def unread_summary(self, request):
        user = request.user

        # Берём статистику по диалогам
        stats = (
            PrivateMessage.objects
            .filter(Q(sender=user) | Q(target=user))
            .values(dialog_user=Case(
                When(sender=user, then=F("target")),
                default=F("sender"),
                output_field=IntegerField()
            ))
            .annotate(
                last_msg_id=Max("id"),
                unread_count=Count("id", filter=Q(target=user, is_read=False)),
            )
        )

        # Забираем сами сообщения
        last_message_objs = {
            m.id: m
            for m in PrivateMessage.objects.filter(
                id__in=[s["last_msg_id"] for s in stats]
            )
        }

        # Загружаем данные пользователей (username, avatar)
        users = {
            u.id: u
            for u in User.objects.filter(
                id__in=[s["dialog_user"] for s in stats]
            )
        }
        

        # Формируем ответ — last_message теперь НЕ объект
        # Формируем ответ
        result = []
        for s in stats:
            msg_obj = last_message_objs.get(s["last_msg_id"])
            u = users.get(s["dialog_user"])

            result.append({
                "user_id": s["dialog_user"],
                "username": u.username if u else "",
                "avatar": request.build_absolute_uri(u.avatar.url) if (u and u.avatar) else None,
                "last_message": msg_obj.text if msg_obj else "",
                "unread_count": s["unread_count"],
            })

        return Response(result)


    #  # 👇 УДАЛЕНИЕ СООБЩЕНИЯ У ВСЕХ
    # @action(detail=True, methods=["DELETE"], url_path="delete-for-all")
    # def delete_for_all(self, request, pk=None):
    #     user = request.user

    #     try:
    #         message = PrivateMessage.objects.get(pk=pk)
    #     except PrivateMessage.DoesNotExist:
    #         return Response(
    #             {"detail": "Сообщение не найдено"},
    #             status=status.HTTP_404_NOT_FOUND
    #         )

    #     # ❗️Только отправитель может удалить у всех
    #     if message.sender != user:
    #         return Response(
    #             {"detail": "Вы можете удалить только свои сообщения"},
    #             status=status.HTTP_403_FORBIDDEN
    #         )

    #     target_id = message.target_id
    #     sender_id = message.sender_id
    #     message_id = message.id

    #     # Удаляем файлы (если есть)
    #     if hasattr(message, "files"):
    #         message.files.all().delete()

    #     # Удаляем сообщение
    #     message.delete()

    #     # 🔥 Уведомляем обоих через WebSocket
    #     channel_layer = get_channel_layer()

    #     payload = {
    #         "type": "message_deleted",
    #         "message_id": message_id
    #     }

    #     async_to_sync(channel_layer.group_send)(
    #         f"chat_{sender_id}",
    #         payload
    #     )

    #     async_to_sync(channel_layer.group_send)(
    #         f"chat_{target_id}",
    #         payload
    #     )

    #     return Response(
    #         {"detail": "Сообщение удалено у всех"},
    #         status=status.HTTP_200_OK
    #     )



    # 👇 УДАЛЕНИЕ СООБЩЕНИЯ У ВСЕХ
    @action(detail=True, methods=["DELETE"], url_path="delete-for-all")
    def delete_for_all(self, request, pk=None):
        user = request.user

        try:
            message = PrivateMessage.objects.get(pk=pk)
        except PrivateMessage.DoesNotExist:
            return Response(
                {"detail": "Сообщение не найдено"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ❗️Только отправитель может удалить у всех
        if message.sender != user:
            return Response(
                {"detail": "Вы можете удалить только свои сообщения"},
                status=status.HTTP_403_FORBIDDEN
            )

        target_id = message.target_id
        sender_id = message.sender_id
        message_id = message.id

        # 🔥 ИСПРАВЛЕНИЕ: Физически удаляем файлы с диска перед удалением из БД
        if hasattr(message, "files"):
            for msg_file in message.files.all():
                if msg_file.file:
                    msg_file.file.delete(save=False) # Удаление с диска
                msg_file.delete() # Удаление записи из БД

        # Удаляем сообщение
        message.delete()

        # 🔥 Уведомляем обоих через WebSocket
        channel_layer = get_channel_layer()
        payload = {
            "type": "message_deleted",
            "message_id": message_id
        }
        async_to_sync(channel_layer.group_send)(f"chat_{sender_id}", payload)
        async_to_sync(channel_layer.group_send)(f"chat_{target_id}", payload)

        return Response(
            {"detail": "Сообщение удалено у всех"},
            status=status.HTTP_200_OK
        )




from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status




class SearchGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.GET.get("q", "").strip()
        if not q:
            return Response([])

        groups = Group.objects.filter(title__icontains=q)[:20]  # ограничение 20
        serializer = GroupListSerializer(groups, many=True)
        return Response(serializer.data)
    



from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import GroupMessage, Group, GroupMember
from .serializers import GroupMessageSerializer
import mimetypes

def get_file_type(file):
    content_type = file.content_type

    if content_type.startswith("image/"):
        return "image"
    if content_type.startswith("video/"):
        return "video"
    if content_type.startswith("audio/"):
        return "audio"   # ← НЕ voice

    return "file"



from rest_framework.pagination import PageNumberPagination

class GroupMessagePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


class GroupMessageViewSet(viewsets.ModelViewSet):
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = GroupMessagePagination

    
    def get_queryset(self):
        # если запрос на конкретное сообщение (retrieve / destroy)
        if self.action in ["retrieve", "destroy", "mark_read"]:
            return GroupMessage.objects.all()

        group_id = self.request.query_params.get("group")
        if not group_id:
            return GroupMessage.objects.none()

        if not GroupMember.objects.filter(
            group_id=group_id,
            user=self.request.user
        ).exists():
            return GroupMessage.objects.none()

        return (
            GroupMessage.objects
            .filter(group_id=group_id)
            .select_related("sender")
            .prefetch_related("files")
            .order_by("-created_at")
        )




    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = GroupMessage.objects.select_related("sender").get(pk=pk)
        user = request.user

        # проверка, что пользователь в группе
        if not GroupMember.objects.filter(group=message.group, user=user).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        if user != message.sender and user not in message.read_by.all():
            message.read_by.add(user)
            message.save()

            # 🔔 отправляем через WebSocket обновление прочитавших
            channel_layer = get_channel_layer()
            read_by_usernames = [u.username for u in message.read_by.all()]
            async_to_sync(channel_layer.group_send)(
                f"group_{message.group.id}",
                {
                    "type": "messages_read_update",
                    "message_id": message.id,
                    "read_by": read_by_usernames
                }
            )

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    

    def perform_create(self, serializer):
        group_id = self.request.data.get("group")

        # 1. Сначала сохраняем само сообщение
        message = serializer.save(
            sender=self.request.user,
            group_id=group_id
        )

        # 2. Получаем списки файлов и миниатюр
        files = self.request.FILES.getlist("files")
        thumbnails = self.request.FILES.getlist("thumbnails")

        thumb_index = 0 # Счетчик для прохода по списку миниатюр
        for f in files:
            file_type = get_file_type(f)
            
            # Создаем объект файла
            msg_file = GroupMessageFile(
                message=message,
                file=f,
                type=file_type
            )

            # 🚀 СВЯЗКА ВИДЕО И МИНИАТЮРЫ
            # Если это видео, берем следующую по порядку миниатюру из списка thumbnails
            if file_type == "video" and thumb_index < len(thumbnails):
                msg_file.thumbnail = thumbnails[thumb_index]
                thumb_index += 1
            
            msg_file.save()

        # 3. WebSocket уведомление (теперь сериализатор увидит созданные файлы)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"group_{group_id}",
            {
                "type": "group_message",
                "message": GroupMessageSerializer(
                    message, 
                    context={"request": self.request}
                ).data
            }
        )

        # 4. Уведомление об ответе (Reply)
        if message.reply_to:
            original_author = message.reply_to.sender
            if original_author != self.request.user:
                async_to_sync(channel_layer.group_send)(
                    f"user_{original_author.id}",
                    {
                        "type": "reply_notification",
                        "payload": {
                            "group_id": message.group.id,
                            "reply_message_id": message.id,
                            "original_message_id": message.reply_to.id,
                            "from_user": self.request.user.username,
                            "text": message.text,
                        },
                    }
                )





      # 🔹 Новый метод удаления
    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        user = request.user

        # Проверка, что пользователь — отправитель
        if message.sender != user:
            return Response(
                {"detail": "Вы можете удалить только свои сообщения."},
                status=status.HTTP_403_FORBIDDEN
            )

        group_id = message.group.id
        message.delete()

        # 🔔 Уведомляем всех участников через WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"group_{group_id}",
            {
                "type": "group_message_deleted",
                "message_id": kwargs["pk"]
            }
        )

        return Response({"status": "deleted"}, status=status.HTTP_200_OK)




class MessageRegionChatViewSet(viewsets.ModelViewSet):
    serializer_class = MessageRegionChatSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = RegionChatPagination

    def get_queryset(self):
        queryset = MessageRegionChat.objects.select_related('user', 'reply_to') \
                                            .prefetch_related('files')
        
        region_id = self.request.query_params.get('region')
        if region_id:
            queryset = queryset.filter(region_id=region_id)
        
        # Сортируем от старых к новым (по возрастанию)
        return queryset.order_by('-created_at')
        
    
    def destroy(self, request, *args, **kwargs):
        # Получаем объект сообщения, который пытаются удалить
        instance = self.get_object()

        # 1. Защита: проверяем, что удаляет именно автор
        if instance.user != request.user:
            return Response(
                {"detail": "Вы не можете удалить чужое сообщение."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        region_id = instance.region_id
        message_id = instance.id

        # 2. Удаляем сообщение из базы данных
        self.perform_destroy(instance)

        # 3. 🔔 SOCKET NOTIFY: Говорим всем в чате, что сообщение удалено
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"region_{region_id}",
            {
                "type": "delete_message_notify", # Новый тип события
                "message_id": message_id,
            }
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


    def create(self, request, *args, **kwargs):
        data = request.data
        files = request.FILES.getlist('uploaded_files') # Обычные файлы (фото/видео)
        voice = request.FILES.get('voice') # 🔥 Отлавливаем голосовое сообщение!
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.save(user=self.request.user)

        # Сохраняем обычные прикрепленные файлы
        for f in files:
            content_type = f.content_type
            file_type = 'image'
            if 'video' in content_type:
                file_type = 'video'
            elif 'audio' in content_type:
                file_type = 'audio'

            MessageRegionFile.objects.create(message=message, file=f, type=file_type)
        
        # 🔥 Сохраняем голосовое сообщение, если оно прилетело
        if voice:
            MessageRegionFile.objects.create(message=message, file=voice, type='audio')
        
        full_message_data = MessageRegionChatSerializer(
            message, 
            context={'request': request} 
        ).data

        # 🔔 SOCKET NOTIFY
        channel_layer = get_channel_layer()
        region_id = message.region_id

        async_to_sync(channel_layer.group_send)(
            f"region_{region_id}",
            {
                "type": "new_message_notify",
                "message_id": message.id,
                "message": full_message_data,
            }
        )
        
        return Response(full_message_data, status=status.HTTP_201_CREATED)







class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupListSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)



    # --- ДОБАВЬ ЭТОТ МЕТОД ---
    def perform_create(self, serializer):
        # 1. Сохраняем группу, указывая владельца
        group = serializer.save(owner=self.request.user)
        
        # 2. Автоматически добавляем создателя в таблицу участников (GroupMember)
        # Это решит проблему доступа к приватным группам сразу после создания
        GroupMember.objects.get_or_create(
            group=group,
            user=self.request.user,
            defaults={"role": "owner"}
        )


    def get_queryset(self):
        return Group.objects.annotate(
            members_count=Count("members")
        )

    def retrieve(self, request, *args, **kwargs):
        group = self.get_object()

        # 🔐 приватная группа — только для участников
        if group.is_private and not GroupMember.objects.filter(
            group=group,
            user=request.user
        ).exists():
            return Response(
                {"detail": "Group is private"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        group = self.get_object()
        user = request.user

        if group.is_private:
            return Response(
                {"detail": "Это приватная группа"},
                status=status.HTTP_403_FORBIDDEN
            )

        member, created = GroupMember.objects.get_or_create(
            group=group,
            user=user,
            defaults={"role": "member"}
        )

        if not created:
            return Response(
                {"detail": "Вы уже участник группы"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"detail": "Вы успешно вступили в группу"},
            status=status.HTTP_201_CREATED
        )
    

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return GroupUpdateSerializer
        return GroupListSerializer

    def update(self, request, *args, **kwargs):
        group = self.get_object()

        # 🔐 только owner / admin
        if not GroupMember.objects.filter(
            group=group,
            user=request.user,
            role__in=["owner", "admin"]
        ).exists():
            return Response(
                {"detail": "Нет прав на редактирование группы"},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

  
    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        group = self.get_object()
        user = request.user

        try:
            membership = GroupMember.objects.get(group=group, user=user)
        except GroupMember.DoesNotExist:
            return Response(
                {"detail": "Вы не участник группы"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if membership.role == "owner":
            return Response(
                {"detail": "Владелец не может покинуть группу"},
                status=status.HTTP_403_FORBIDDEN
            )

        membership.delete()

        return Response({"status": "left"}, status=status.HTTP_200_OK)



    # @action(detail=True, methods=["get"])
    # def members(self, request, pk=None):
    #     group = self.get_object()

    #     # 🔒 доступ только участникам
    #     if not GroupMember.objects.filter(
    #         group=group, user=request.user
    #     ).exists():
    #         return Response(status=403)

    #     members = (
    #         GroupMember.objects
    #         .filter(group=group)
    #         .select_related("user")
    #     )

    #     serializer = GroupMemberSerializer(members, many=True, context={"request": request})
    #     return Response(serializer.data)


    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        group = self.get_object()

        # РАЗРЕШАЕМ просмотр участников, если группа НЕ приватная 
        # ИЛИ если пользователь является участником
        is_member = GroupMember.objects.filter(group=group, user=request.user).exists()
        
        if group.is_private and not is_member:
            return Response({"detail": "Группа приватная"}, status=403)

        members = (
            GroupMember.objects
            .filter(group=group)
            .select_related("user")
        )

        serializer = GroupMemberSerializer(members, many=True, context={"request": request})
        return Response(serializer.data)


import pytz
from django.utils import timezone





# views.py

# from django.db.models import Q, F, Case, When, IntegerField
# from .models import PrivateMessage, Message, Group

# Импортируем твою новую функцию
from .services import get_single_chat_summary

class ChatSummaryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        result_chats = []

        # ==========================================
        # 1. ПРИВАТНЫЕ ЧАТЫ (Сбор уникальных собеседников)
        # ==========================================
        # Находим всех, с кем переписывался юзер (как отправитель или получатель)
        private_dialogs = (
            PrivateMessage.objects
            .filter(Q(sender=user) | Q(target=user))
            .values_list('sender_id', 'target_id')
        )

        # Используем set для уникальности ID собеседников
        companion_ids = set()
        for sender_id, target_id in private_dialogs:
            if sender_id != user.id:
                companion_ids.add(sender_id)
            else:
                companion_ids.add(target_id)

        # Проходим по ID и формируем данные через сервис
        for companion_id in companion_ids:
            chat_data = get_single_chat_summary(
                user=user,
                chat_type="private",
                companion_id=companion_id
            )
            if chat_data:
                result_chats.append(chat_data)

        # ==========================================
        # 2. ЧАТЫ ПО ТОВАРАМ
        # ==========================================
        # Находим уникальные пары (товар + собеседник)
        product_dialogs = (
            Message.objects
            .filter(Q(sender=user) | Q(receiver=user))
            .filter(product_id__isnull=False)  # 🔥 ВАЖНО: только сообщения с привязкой к товару
            .annotate(
                companion_id=Case(
                    When(sender=user, then=F("receiver_id")),
                    default=F("sender_id"),
                    output_field=IntegerField()
                )
            )
            .values('product_id', 'companion_id')
            .distinct() 
        )

        for item in product_dialogs:
            chat_data = get_single_chat_summary(
                user=user,
                chat_type="product",
                companion_id=item['companion_id'],
                product_id=item['product_id']
            )
            if chat_data:
                result_chats.append(chat_data)

        # ==========================================
        # 3. ГРУППОВЫЕ ЧАТЫ
        # ==========================================
        user_groups = Group.objects.filter(members__user=user)

        for group in user_groups:
            chat_data = get_single_chat_summary(
                user=user,
                chat_type="group",
                group_id=group.id
            )
            if chat_data:
                result_chats.append(chat_data)

        # ==========================================
        # ФИНАЛ: Сортировка и подсчет
        # ==========================================
        # Сортируем по дате последнего сообщения (новые сверху)
        # Используем "0" или старую дату для чатов без сообщений, чтобы не ломался sort
        result_chats.sort(
            key=lambda x: x["last_message_at"] or "1970-01-01",
            reverse=True
        )

        total_unread = sum(c["unread_count"] for c in result_chats)

        return Response({
            "total_unread": total_unread,
            "chats": result_chats
        })



from django.db.models import Prefetch




class StoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"] 

    


  

    def get_queryset(self):
        user = self.request.user

        # 1) подписки
        following_ids = Follow.objects.filter(
            follower=user
        ).values_list("following_id", flat=True)

        # 2) подзапрос: есть ли не просмотренные сторис
        unviewed_qs = Story.objects.filter(
            user=OuterRef("user"),
            is_active=True,
            expires_at__gt=timezone.now()
        ).exclude(
            views__user=user
        )

        # 3) аннотация: дата последней сторис
        last_story_at = Story.objects.filter(
            user=OuterRef("user"),
            is_active=True,
            expires_at__gt=timezone.now()
        ).values("user").annotate(
            last_at=Max("created_at")
        ).values("last_at")

        return (
            Story.objects
            .filter(
                is_active=True,
                expires_at__gt=timezone.now(),
                user_id__in=following_ids
            )
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "views",
                    queryset=StoryView.objects.filter(user=user),
                )
            )
            .annotate(
                has_unviewed=Exists(unviewed_qs),
                last_story_at=Subquery(last_story_at)
            )
            .order_by("-has_unviewed", "-last_story_at", "-created_at", "user_id", )
        )





    @action(detail=False, methods=["get"], url_path="mine")
    def my_stories(self, request):
        """Возвращает только сторис текущего пользователя"""
        user = request.user
        stories = Story.objects.filter(
            user=user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).order_by("-created_at")

        serializer = StoryListSerializer(stories, many=True, context={"request": request})
        return Response(serializer.data)



    def get_serializer_class(self):
        if self.action == "create":
            return StoryCreateSerializer
        return StoryListSerializer

    def perform_create(self, serializer):
        story = serializer.save(user=self.request.user)  

        channel_layer = get_channel_layer()

        follower_ids = Follow.objects.filter(
            following=self.request.user
        ).values_list("follower_id", flat=True)

        for uid in follower_ids:
            async_to_sync(channel_layer.group_send)(
                f"user_{uid}",
                {
                    "type": "story_created",
                    "story_id": story.id,
                    "author_id": self.request.user.id,
                }
            )

    
      # ========================== NEW ==========================
    from django.shortcuts import get_object_or_404

    @action(detail=True, methods=["post"], url_path="view")
    def mark_viewed(self, request, pk=None):
        story = get_object_or_404(Story, pk=pk)

        # Не ставим viewed на свои сторис
        if story.user == request.user:
            return Response({"status": "cannot_view_own_story"}, status=400)

        # Проверяем, если уже есть view для этого пользователя
        story_view, created = StoryView.objects.get_or_create(
            story=story,
            user=request.user
        )

        if created:
            channel_layer = get_channel_layer()

            # 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ: Используем сериализатор 🔥
            # Обязательно передаем context={"request": request}, чтобы DRF смог собрать полные (абсолютные) URL
            viewer_data = StoryViewerSerializer(story_view, context={"request": request}).data

            async_to_sync(channel_layer.group_send)(
                f"user_{story.user_id}",
                {
                    "type": "story_viewed",
                    "story_id": story.id,
                    "viewer": viewer_data, # 👈 Отправляем идеально отформатированные данные
                }
            )

        if created:
            return Response({"status": "viewed"}, status=201)
        else:
            return Response({"status": "already_viewed"}, status=200)

    

    @action(detail=True, methods=["get"], url_path="viewers")
    def viewers(self, request, pk=None):
        # 🔹 разрешаем получить viewers для своих сторис, даже если story не в get_queryset()
        story = get_object_or_404(Story, pk=pk)

        views = StoryView.objects.filter(story=story).select_related("user").order_by("-viewed_at")
        serializer = StoryViewerSerializer(views, many=True, context={"request": request})
        return Response(serializer.data)


    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_story(self, request, pk=None):
        story = get_object_or_404(
            Story,
            id=pk,
            user=request.user,
            is_active=True
        )

        # soft delete
        story.is_active = False
        story.save(update_fields=["is_active"])

        # 🔥 уведомляем подписчиков
        channel_layer = get_channel_layer()

        follower_ids = Follow.objects.filter(
            following=request.user
        ).values_list("follower_id", flat=True)

        for uid in follower_ids:
            async_to_sync(channel_layer.group_send)(
                f"user_{uid}",
                {
                    "type": "story_deleted",
                    "story_id": story.id,
                    "author_id": request.user.id,
                }
            )

        # 🔥 уведомляем СЕБЯ (чтобы сразу пропало)
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}",
            {
                "type": "story_deleted",
                "story_id": story.id,
                "author_id": request.user.id,
            }
        )

        return Response({"status": "deleted"})




class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["post", "delete", "get"]

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)

    # ===================== FOLLOW =====================
    @action(detail=False, methods=["post"], url_path="follow/(?P<user_id>[^/.]+)")
    def follow(self, request, user_id=None):
        if int(user_id) == request.user.id:
            return Response(
                {"detail": "Нельзя подписаться на себя"},
                status=400
            )

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following_id=user_id
        )

        return Response(
            {"status": "followed" if created else "already_followed"}
        )

    # ===================== UNFOLLOW =====================
    @action(detail=False, methods=["post"], url_path="unfollow/(?P<user_id>[^/.]+)")
    def unfollow(self, request, user_id=None):
        Follow.objects.filter(
            follower=request.user,
            following_id=user_id
        ).delete()

        return Response({"status": "unfollowed"})

    # ===================== STATS =====================
    @action(detail=False, methods=["get"], url_path="stats/(?P<user_id>[^/.]+)")
    def stats(self, request, user_id=None):
        followers_count = Follow.objects.filter(
            following_id=user_id
        ).count()

        following_count = Follow.objects.filter(
            follower_id=user_id
        ).count()

        is_following = Follow.objects.filter(
            follower=request.user,
            following_id=user_id
        ).exists()

        return Response({
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": is_following,
        })
