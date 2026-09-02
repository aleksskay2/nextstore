from calendar import c
import random
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
from calendar import c
from store.tasks import send_verification_email_task 

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, permissions, serializers
from .models import  PrivateMessage, StoryLike, MessageRegionFile, Admins, MessageFile, Product, Message, MessageRegionChat, FeatureTemplate, ProductImage, ProductReview, Bookmark,SelectionObject, Regions, Category, FeatureProduct, CustomUser
from .models import Group, GroupMember, UserContact,  GroupMessage, GroupMessageFile, Follow
from .models import Story, StoryView
from .serializers import AdminsSerializer, StoryViewerSerializer, UserContactSerializer, PrivateMessageFile, MessageRegionChatSerializer,  FollowSerializer, GroupUpdateSerializer,GroupDetailSerializer, CustomUserSerializer, GroupCreateSerializer, GroupListSerializer, PrivateMessageSerializer, FeatureTemplateSerializer, ProductListSerializer, ProductDetailSerializer, ProductImagesSerializer, ProductReviewSerializer, MessageSerializer, BookmarkSerializer,  SelectionObjectSerializer, RegionsSerializer
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

        # 🔥 ОЧИЩАЕМ КЭШ ПОЛЬЗОВАТЕЛЯ
        cache.delete(f"user_full_profile:{user.id}")
        # 🔥 Используем сериализатор, чтобы он сгенерировал правильную ссылку с ?t=...
        avatar_url = CustomUserSerializer(user, context={"request": request}).data.get("avatar")

        return Response({"avatar": avatar_url}, status=200)


       
    
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

        username = request.data.get("username")
        region = request.data.get("region")
        phone = request.data.get("phone")
        email = request.data.get("email")
        avatar = request.FILES.get("avatar")

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

        # 🔥 ОЧИЩАЕМ КЭШ ПОЛЬЗОВАТЕЛЯ, чтобы full_profile отдавал свежие данные!
        cache.delete(f"user_full_profile:{user.id}")

       # 🔥 ИСПРАВЛЕНО: добавили context={"request": request}
        user_data = CustomUserSerializer(user, context={"request": request}).data

        return Response(
            {"status": "success", "user": user_data},
            status=200,
        )


    @action(detail=False, methods=["patch"], url_path="toggle-privacy")
    def toggle_privacy(self, request):
        """Включает или выключает отображение аккаунта в поиске"""
        user = request.user
        
        # Получаем значение из запроса
        is_open = request.data.get("is_open")
        
        if is_open is None:
            return Response({"error": "Не передано значение is_open"}, status=400)
            
        # Защита на случай, если с фронтенда прилетит строка 'true'/'false' вместо boolean
        if isinstance(is_open, str):
            is_open = is_open.lower() in ['true', '1', 'yes']
            
        user.is_open = is_open
        user.save()
        
        return Response({
            "status": "success",
            "is_open": user.is_open
        }, status=200)

    @action(detail=True, methods=["get"], url_path="full-profile")
    def full_profile(self, request, pk=None):
        """Возвращает расширенный профиль пользователя и его товары"""
        
        # 🔥 ЗАЩИТА: Проверяем, что ID — это число. 
        # Если фронтенд прислал 'undefined', мы отдадим красивый 400 Bad Request без падения базы
        if not str(pk).isdigit():
            return Response(
                {"error": "Invalid user ID. Expected an integer."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = pk
        cache_key = f"user_full_profile:{user_id}"

        # 1) ПРОБА КЭША
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 2) ДЕЛАЕМ ЗАПРОСЫ К БД
        # Используем self.get_queryset() или твою модель User
        user = get_object_or_404(CustomUser, id=user_id)
        
        # Передаем self.get_serializer, либо твой CustomUserSerializer
        user_data = CustomUserSerializer(user, context={"request": request}).data

        products = Product.objects.filter(owner_id=user_id, productUser='owner')
        product_data = ProductListSerializer(
            products, many=True, context={"request": request}
        ).data

        payload = {
            "user": user_data,
            "products": product_data
        }

        # 3) КЭШИРУЕМ НА 60 СЕК
        cache.set(cache_key, payload, timeout=60)

        return Response(payload, status=status.HTTP_200_OK)





User = get_user_model()
class SyncContactsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Ждем новый формат: {"contacts": [{"phone": "+79...", "name": "Брат"}, ...]}
        contacts_data = request.data.get("contacts", [])
        
        # Поддержка старого формата (если фронтенд еще не обновлен)
        phones_only = request.data.get("phones", [])

        if contacts_data:
            # Извлекаем только номера для поиска в БД
            phone_numbers = [c.get("phone") for c in contacts_data if c.get("phone")]
            registered_users = User.objects.filter(phone__in=phone_numbers).exclude(id=request.user.id).only("id", "username", "phone", "avatar", "region")
            
            # Словарь для быстрого поиска локального имени по телефону
            phone_to_name = {c.get("phone"): c.get("name") for c in contacts_data}

            # 🔥 СОХРАНЯЕМ ИМЕНА В БАЗУ ДАННЫХ
            for r_user in registered_users:
                local_name = phone_to_name.get(r_user.phone) or r_user.username
                UserContact.objects.update_or_create(
                    owner=request.user,
                    contact_user=r_user,
                    defaults={"local_name": local_name}
                )

        elif phones_only:
            # Старая логика (просто поиск без сохранения имен)
            if not isinstance(phones_only, list):
                return Response({"error": "Ожидается список"}, status=status.HTTP_400_BAD_REQUEST)
            registered_users = User.objects.filter(phone__in=phones_only).exclude(id=request.user.id).only("id", "username", "phone", "avatar", "region")
        else:
            return Response({"error": "Нет данных контактов"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserContactSerializer(registered_users, many=True, context={"request": request})
        return Response({"registered_contacts": serializer.data}, status=status.HTTP_200_OK)





class VerifyEmailView(APIView):
    # Этот эндпоинт должен быть доступен гостям без токена авторизации
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        # Валидация входных данных
        if not email or not code:
            return Response(
                {"detail": "Email и код подтверждения обязательны."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Ищем пользователя, у которого совпадает и почта, и сохраненный код
            user = User.objects.get(email=email, verification_code=code)
            
            # Активируем пользователя
            user.is_active = True
            user.verification_code = None  # Стираем код, так как он больше не нужен
            user.save()

            return Response(
                {"status": "success", "detail": "Аккаунт успешно активирован! Теперь вы можете войти."}, 
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            # Если код не совпал или пользователя с таким email нет
            return Response(
                {"detail": "Неверный код подтверждения или некорректный Email."}, 
                status=status.HTTP_400_BAD_REQUEST
            )







from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FCMDevice
from rest_framework.decorators import action
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

    # 🔥 НОВЫЙ МЕТОД: Удаление токена при выходе (logout)
    @action(detail=False, methods=['post'], url_path='remove-token')
    def remove_token(self, request):
        token = request.data.get('expo_push_token')
        
        if not token:
            return Response(
                {"error": "Поле expo_push_token обязательно."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Удаляем конкретно этот токен у текущего пользователя
        deleted_count, _ = FCMDevice.objects.filter(
            expo_push_token=token, 
            user=request.user
        ).delete()
        
        if deleted_count > 0:
            return Response(
                {"status": "success", "message": "Устройство успешно отвязано"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"status": "not_found", "message": "Токен не найден или уже удален"}, 
                status=status.HTTP_404_NOT_FOUND
            )




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



from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle




class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'





class PasswordResetRequestView(APIView):
    def post(self, request):
        # Очищаем email от случайных пробелов
        email = request.data.get('email', '').strip()
        
        # Если прислали пустую строку, сразу выдаем ошибку 400
        if not email:
            return Response({"error": "Email обязателен"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 🔥 Вместо .get() используем .filter().first()
            # Это спасет от ошибки 500, если в базе несколько одинаковых email (или пустых строк)
            user = User.objects.filter(email=email).first()
            
            if not user:
                # Если пользователь не найден, возвращаем 200 (в целях безопасности)
                return Response({"message": "Если email зарегистрирован, код отправлен"}, status=status.HTTP_200_OK)
                
        except Exception as db_error:
            print(f"❌ Ошибка базы данных: {db_error}")
            return Response({"error": "Ошибка при поиске пользователя"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Генерируем код
        verification_code = str(random.randint(100000, 999999))
        
        # Сохраняем код пользователю
        try:
            user.verification_code = verification_code
            user.save()
        except Exception as save_error:
            print(f"❌ Ошибка при сохранении кода в модель: {save_error}")
            return Response({"error": "Не удалось сгенерировать код доступа"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Отправляем в Celery
        try:
            send_verification_email_task.delay(email, verification_code)
            print(f"🚀 [Celery Восстановление] Задача на отправку кода {verification_code} добавлена для {email}")
        except Exception as celery_error:
            # Если Celery упал, мы НЕ валим весь сервер (не отдаем 500), а логируем ошибку
            print(f"❌ Ошибка Celery: {celery_error}")
            
        return Response({"message": "Код успешно отправлен на вашу почту"}, status=status.HTTP_200_OK)


# ШАГ 2: Проверка кода и сохранение нового пароля
class PasswordResetConfirmView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not all([email, code, new_password]):
            return Response({"error": "Все поля (email, code, new_password) обязательны"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Неверный запрос"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Проверяем код из базы данных
        if not user.verification_code or user.verification_code != str(code):
            return Response({"error": "Неверный или просроченный код подтверждения"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Хешируем и сохраняем новый пароль
        user.set_password(new_password)
        
        # Очищаем код, чтобы его нельзя было использовать повторно
        user.verification_code = None
        user.save()
        
        return Response({"message": "Пароль успешно изменен"}, status=status.HTTP_200_OK)





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
                # 🔥 ДОБАВЛЕНО: is_open=True. 
                # Логика: (Имя содержит q ИЛИ Email содержит q) И Аккаунт открыт
                .filter(Q(username__icontains=q) | Q(email__icontains=q), is_open=True)
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
        return (
            Message.objects.filter(Q(sender=user) | Q(receiver=user))
            .select_related("sender", "receiver", "product")
            .prefetch_related("files")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        """
        Стандартный метод создания сообщения (POST /api/messages/).
        Обрабатывает текст, загрузку файлов и трансляцию в WebSocket.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 1. Получаем товар и ID получателя из запроса
        product = serializer.validated_data.get("product")
        if not product:
            raise serializers.ValidationError({"product": "Товар обязателен"})

        receiver_id = request.data.get("receiver_id")
        if not receiver_id:
            raise serializers.ValidationError({"receiver_id": "Укажите ID получателя"})

        # Проверка: нельзя писать самому себе Probel
        if str(receiver_id) == str(request.user.id):
            raise serializers.ValidationError({"detail": "Нельзя писать сообщение самому себе"})

        # Находим пользователя-получателя в БД
        User = get_user_model()
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"receiver_id": "Пользователь не найден"})

        # Защита: один из участников чата должен быть владельцем товара
        if request.user != product.owner and receiver != product.owner:
            raise serializers.ValidationError(
                {"detail": "Один из участников чата должен быть владельцем товара"}
            )

        # 2. Сохраняем основное сообщение
        message = serializer.save(sender=request.user, receiver=receiver)

        # 3. Обрабатываем прикрепленные файлы/изображения
        uploaded_files = request.FILES.getlist("files") or request.FILES.getlist("images")

        for file_obj in uploaded_files:
            mime_type, _ = mimetypes.guess_type(file_obj.name)
            if mime_type and mime_type.startswith("audio"):
                f_type = "audio"
            elif mime_type and mime_type.startswith("video"):
                f_type = "video"
            else:
                f_type = "image"

            MessageFile.objects.create(message=message, file=file_obj, type=f_type)

        # 4. Пересобираем данные с учетом файлов
        message = Message.objects.prefetch_related("files").get(pk=message.pk)
        serialized_data = self.get_serializer(message).data

        # 5. Отправка события в WebSocket
        channel_layer = get_channel_layer()
        chat_id = f"product_{product.id}_{request.user.id if request.user.id != product.owner.id else receiver.id}"

        socket_data = {**serialized_data, "chat_id": chat_id}

        async_to_sync(channel_layer.group_send)(
            f"product_chat_{product.id}",
            {
                "type": "new_message",
                "message": socket_data,
            },
        )

        headers = self.get_success_headers(serialized_data)
        return Response(serialized_data, status=status.HTTP_201_CREATED, headers=headers)

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
        messages = list(qs[offset:offset+limit][::-1])
        serializer = self.get_serializer(messages, many=True)

        return Response({
            "messages": serializer.data,
            "total": total_count,
        })

    @action(detail=False, methods=['get'], url_path='chats')
    def chats(self, request):
        user_id = request.user.id

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
                last_text = msg.text
                if not last_text and msg.files.exists():
                    f_type = msg.files.first().type
                    types_map = {"image": "📷 Фото", "video": "🎥 Видео", "audio": "🎤 Голос"}
                    last_text = types_map.get(f_type, "📎 Файл")

                response_data.append({
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



    # 🔥 НОВЫЙ ЭНДПОИНТ: Отметка голосового по товарам как прослушанного
    @action(detail=False, methods=['post'], url_path='mark-audio-listened')
    def mark_audio_listened(self, request):
        file_id = request.data.get("file_id")

        if not file_id:
            return Response(
                {"detail": "Параметр file_id обязателен"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            msg_file = MessageFile.objects.select_related("message").get(id=file_id)
        except MessageFile.DoesNotExist:
            return Response(
                {"detail": f"Файл #{file_id} не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Проверяем, что запрос делает участник этой переписки (продавец или покупатель)
        if request.user not in [msg_file.message.sender, msg_file.message.receiver]:
            return Response(
                {"detail": "Нет доступа к этому сообщению"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Помечаем файл как прослушанный
        if not msg_file.is_listened:
            msg_file.is_listened = True
            msg_file.save(update_fields=["is_listened"])
            print(f"✅ [PRODUCT AUDIO LISTENED] Файл #{file_id} успешно помечен как прослушанный!")

        return Response(
            {"status": "ok", "file_id": file_id, "is_listened": True}, 
            status=status.HTTP_200_OK
        )




    @action(detail=False, methods=['delete'], url_path=r'delete_chat/(?P<companion_id>\d+)/(?P<product_id>\d+)')
    def delete_chat(self, request, companion_id=None, product_id=None):
        """
        Полностью удаляет чат (все сообщения) по товару между текущим юзером и собеседником.
        """
        user = request.user

        # Находим все сообщения между мной и собеседником по этому товару
        messages_to_delete = Message.objects.filter(
            Q(sender=user, receiver_id=companion_id, product_id=product_id) |
            Q(sender_id=companion_id, receiver=user, product_id=product_id)
        )

        if not messages_to_delete.exists():
            return Response(
                {"detail": "Чат не найден или уже удален."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Удаляем сообщения из БД (каскадно удалятся и записи MessageFile)
        deleted_count, _ = messages_to_delete.delete()

        return Response(
            {"detail": "Чат успешно удален", "deleted_messages": deleted_count},
            status=status.HTTP_204_NO_CONTENT
        )


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

import json
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
        # 1. Обработка характеристик
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

        # 🔥 ПУНКТ 2 БЫЛ УДАЛЕН 🔥
        # Видео больше не сохраняем здесь вручную! Сериализатор ProductDetailSerializer 
        # (в котором мы добавили video = serializers.FileField) уже сделал это за нас.

        # 3. Обработка главного изображения
        main_image = request.FILES.get('main_image_webp') or request.FILES.get('main_image')
        if main_image:
            product.main_image_webp = main_image
            product.save(update_fields=['main_image_webp'])

        # 4. Обработка дополнительных изображений
        uploaded_images = request.FILES.getlist('product_images')
        if uploaded_images:
            if is_update:
                product.images.all().delete()

            for img in uploaded_images:
                ProductImage.objects.create(product=product, image=img)

            if not product.main_image_webp:
                first_img = uploaded_images[0]
                first_img.seek(0)
                product.main_image_webp = first_img
                product.save(update_fields=['main_image_webp'])

                
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
        # 1. Извлекаем ID сторис
        story_id = self.request.data.get('story')
        if story_id in ['null', '', None]:
            story_id = None

        # 2. Сохраняем базовое сообщение через сериализатор
        message = serializer.save(sender=self.request.user)

        # 🔥 3. ИСПРАВЛЕННАЯ ЛОГИКА ПЕРЕСЫЛКИ: СМОТРИМ НА ТИП ИСТОЧНИКА!
        forwarded_id = self.request.data.get('forwarded_message_id')
        forwarded_type = self.request.data.get('forwarded_message_type') # 'group', 'private', 'product'

        if forwarded_id and forwarded_id not in ['null', '', None]:
            original_msg = None
            try:
                # В зависимости от типа ищем сообщение в ПРАВИЛЬНОЙ таблице
                if forwarded_type == "group":
                    from .models import GroupMessage # 👈 Проверьте ваш импорт
                    original_msg = GroupMessage.objects.get(id=forwarded_id)
                elif forwarded_type == "product":
                    from .models import Message # 👈 Проверьте ваш импорт
                    original_msg = Message.objects.get(id=forwarded_id)
                else:
                    # По умолчанию считаем, что это личное сообщение
                    original_msg = PrivateMessage.objects.get(id=forwarded_id)
                
                # Копируем текст
                if not message.text and getattr(original_msg, 'text', None):
                    message.text = original_msg.text
                    message.save(update_fields=['text'])
                
                # Копируем прикрепленные файлы
                if hasattr(original_msg, 'files'):
                    FileModel = message.files.model # Модель файлов ТЕКУЩЕГО сообщения (PrivateMessageFile)
                    
                    for orig_file in original_msg.files.all():
                        new_file = FileModel(message=message)
                        
                        # Переносим свойства
                        for attr in ['file_type', 'type', 'file_name', 'name', 'duration', 'mime_type']:
                            if hasattr(orig_file, attr):
                                setattr(new_file, attr, getattr(orig_file, attr))
                        
                        # Копируем физический файл
                        if orig_file.file:
                            new_file.file.save(
                                orig_file.file.name.split('/')[-1],
                                orig_file.file,
                                save=False
                            )
                        new_file.save()
            except Exception as e:
                print(f"Ошибка при копировании пересланного сообщения: {e}")

        # 4. Привязываем к сторис, если это ответ на сторис
        if story_id:
            message.story_id = story_id
            message.save(update_fields=['story'])

        # Обязательно обновляем объект из БД после всех изменений (файлов и текста)
        message.refresh_from_db()

        # 5. Сериализуем готовое сообщение для отправки по сокетам
        serializer_data = PrivateMessageSerializer(message, context={'request': self.request}).data

        channel_layer = get_channel_layer()
        
        # Отправляем в сокет получателю (target)
        async_to_sync(channel_layer.group_send)(
            f"chat_{message.target.id}",
            {
                "type": "chat_message",
                "message": serializer_data
            }
        )

        # Отправляем в сокет отправителю (sender)
        async_to_sync(channel_layer.group_send)(
            f"chat_{message.sender.id}",
            {
                "type": "chat_message",
                "message": serializer_data
            }
        )


    # ==============================================================
    # 🔥 НОВЫЙ ЭНДПОИНТ ДЛЯ СОХРАНЕНИЯ ЗВОНКОВ
    # ==============================================================
    @action(detail=False, methods=['POST'], url_path='log-call')
    def log_call(self, request):
        caller_id = request.data.get("caller_id")     # Тот, кто инициировал звонок
        receiver_id = request.data.get("receiver_id") # Тот, кому звонили
        call_status = request.data.get("call_status") # 'answered', 'missed', 'declined'
        call_duration = request.data.get("call_duration", 0)

        if not caller_id or not receiver_id or not call_status:
            return Response(
                {"detail": "caller_id, receiver_id и call_status обязательны."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            caller = User.objects.get(id=caller_id)
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        is_call_read = True if call_status == 'answered' else False

        # 🔥 Создаем системное сообщение-звонок с ПРАВИЛЬНЫМИ ролями
        message = PrivateMessage.objects.create(
            sender=caller,      # Строго тот, кто звонил
            target=receiver,    # Строго тот, кому звонили
            message_type='call',
            call_status=call_status,
            call_duration=int(call_duration),
            text="",
            is_read=is_call_read
        )

        serializer_data = self.get_serializer(message, context={'request': request}).data

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{message.target.id}",
            {"type": "chat_message", "message": serializer_data}
        )
        async_to_sync(channel_layer.group_send)(
            f"chat_{message.sender.id}",
            {"type": "chat_message", "message": serializer_data}
        )

        return Response(serializer_data, status=status.HTTP_201_CREATED)



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

        # 1. Берём статистику по диалогам
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

        last_msg_ids = [s["last_msg_id"] for s in stats if s["last_msg_id"]]
        dialog_user_ids = [s["dialog_user"] for s in stats if s["dialog_user"]]

        # 2. Забираем последние сообщения вместе с файлами
        last_message_objs = {
            m.id: m
            for m in PrivateMessage.objects.filter(
                id__in=last_msg_ids
            ).prefetch_related("files")
        }

        # 3. Загружаем данные пользователей
        users = {
            u.id: u
            for u in User.objects.filter(
                id__in=dialog_user_ids
            )
        }

        # 4. Формируем ответ с обработкой звонков и медиа
        result = []
        for s in stats:
            msg_obj = last_message_objs.get(s["last_msg_id"])
            u = users.get(s["dialog_user"])

            last_text = ""
            if msg_obj:
                # 🔥 Если последнее сообщение — это звонок
                if getattr(msg_obj, "message_type", None) == "call":
                    is_incoming = msg_obj.target_id == user.id

                    if msg_obj.call_status == "missed":
                        last_text = "📞 Пропущенный звонок" if is_incoming else "📞 Отмененный звонок"
                    elif msg_obj.call_status == "declined":
                        last_text = "📞 Отклоненный звонок"
                    else:
                        duration = msg_obj.call_duration or 0
                        if duration > 0:
                            m, sec = divmod(duration, 60)
                            time_str = f"{m}:{sec:02d}"
                            last_text = f"📞 Звонок ({time_str})"
                        else:
                            last_text = "📞 Звонок"

                # 🔥 Если обычное текстовое или медиа-сообщение
                elif msg_obj.text:
                    last_text = msg_obj.text
                elif msg_obj.files.all():
                    first_file = msg_obj.files.all()[0]
                    file_type = getattr(first_file, "type", "")
                    if file_type == "image":
                        last_text = "📷 Фотография"
                    elif file_type == "video":
                        last_text = "🎥 Видео"
                    elif file_type == "audio":
                        last_text = "🎤 Голосовое сообщение"
                    else:
                        last_text = "📎 Вложение"

            # Безопасное формирование URL аватарки
            avatar_url = None
            if u and getattr(u, "avatar", None):
                try:
                    avatar_url = request.build_absolute_uri(u.avatar.url)
                except Exception:
                    avatar_url = u.avatar.url

            result.append({
                "user_id": s["dialog_user"],
                "username": u.username if u else "",
                "avatar": avatar_url,
                "last_message": last_text,
                "unread_count": s["unread_count"],
            })

        return Response(result)



    @action(detail=False, methods=["POST"], url_path=r"mark-audio-listened/(?P<file_id>\d+)")
    def mark_audio_listened(self, request, file_id=None):
        if not file_id:
            file_id = request.data.get("file_id")
            
        if not file_id:
            return Response(
                {"detail": "Параметр file_id обязателен"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            msg_file = PrivateMessageFile.objects.select_related("message").get(id=file_id)
        except PrivateMessageFile.DoesNotExist:
            return Response(
                {"detail": f"Файл #{file_id} не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user not in [msg_file.message.sender, msg_file.message.target]:
            return Response(
                {"detail": "Нет доступа к этому сообщению"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if not msg_file.is_listened:
            msg_file.is_listened = True
            msg_file.save(update_fields=["is_listened"])
            print(f"✅ [AUDIO LISTENED] Файл #{file_id} успешно помечен как прослушанный!")

        return Response({"status": "ok", "file_id": file_id, "is_listened": True}, status=status.HTTP_200_OK)


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
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50
from django.db.models import Count, Case, When, BooleanField # 🔥 Добавьте эти импорты
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, permissions, status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class GroupMessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50

class GroupMessageViewSet(viewsets.ModelViewSet):
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = GroupMessagePagination

    def get_queryset(self):
        if self.action in ["retrieve", "destroy", "mark_read", "mark_audio_listened"]:
            return GroupMessage.objects.all()

        group_id = self.request.query_params.get("group")
        if not group_id:
            return GroupMessage.objects.none()

        # 🔥 1. Считаем общее количество участников группы
        member_count = GroupMember.objects.filter(group_id=group_id).count()

        if member_count == 0 or not GroupMember.objects.filter(group_id=group_id, user=self.request.user).exists():
            return GroupMessage.objects.none()

        return (
            GroupMessage.objects
            .filter(group_id=group_id)
            .select_related("sender")
            .prefetch_related("files", "read_by")
            # 🔥 2. Аннотируем количество прочитавших
            .annotate(read_count=Count('read_by', distinct=True))
            # 🔥 3. Динамически создаем поле is_read_by_all (прочитали ли все участники минус сам автор)
            .annotate(
                is_read_by_all=Case(
                    When(read_count__gte=member_count - 1, then=True),
                    default=False,
                    output_field=BooleanField()
                )
            )
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = GroupMessage.objects.select_related("sender").prefetch_related("read_by").get(pk=pk)
        user = request.user

        # проверка, что пользователь в группе
        if not GroupMember.objects.filter(group=message.group, user=user).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        if user != message.sender and user not in message.read_by.all():
            message.read_by.add(user)
            # В M2M-связях метод save() вызывать не обязательно, add() сохраняет сразу

            # 🔥 1. Формируем список прочитавших С АВАТАРКАМИ
            read_by_users_data = []
            for u in message.read_by.all():
                avatar_url = None
                if u.avatar:
                    try:
                        avatar_url = request.build_absolute_uri(u.avatar.url)
                    except Exception:
                        avatar_url = u.avatar.url

                read_by_users_data.append({
                    "id": u.id,
                    "username": u.username,
                    "avatar": avatar_url
                })

            # 🔥 2. Считаем, прочитали ли сообщение ВСЕ
            group_member_count = GroupMember.objects.filter(group=message.group).count()
            current_read_count = message.read_by.count()
            # Если кол-во прочитавших равно или больше кол-ва участников группы (без учета отправителя)
            is_read_by_all = current_read_count >= (group_member_count - 1)

            # 🔔 3. Отправляем через WebSocket полный список с аватарами и статус is_read_by_all
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"group_{message.group.id}",
                {
                    "type": "messages_read_update",
                    "message_id": message.id,
                    "read_by": read_by_users_data,
                    "is_read_by_all": is_read_by_all  # 🔥 Фронтенд возьмет это поле для синих галочек!
                }
            )
            

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    from django.db.models import Count, Case, When, BooleanField

    def perform_create(self, serializer):
        # 🔥 1. ПЕРЕНОСИМ ВСЕ ИМПОРТЫ В НАЧАЛО ФУНКЦИИ, ЧТОБЫ ИЗБЕЖАТЬ UnboundLocalError
        from .models import GroupMessage, GroupMessageFile, GroupMember 
        
        group_id = self.request.data.get('group')
        story_id = self.request.data.get('story')
        if story_id in ['null', '', None]:
            story_id = None

        # 2. Сохраняем сообщение
        message = serializer.save(sender=self.request.user, group_id=group_id)

        # =================================================================
        # 🔥 3. ГАРАНТИРОВАННОЕ СОХРАНЕНИЕ ФАЙЛОВ И ГОЛОСОВЫХ
        # =================================================================
        files_data = self.request.FILES.getlist('files')
        thumbnails_data = self.request.FILES.getlist('thumbnails')
        
        if files_data and not message.files.exists():
            for i, file_obj in enumerate(files_data):
                mime = file_obj.content_type or ''
                f_type = 'document'
                if 'image' in mime: f_type = 'image'
                elif 'video' in mime: f_type = 'video'
                elif 'audio' in mime: f_type = 'audio'
                
                thumb = thumbnails_data[i] if i < len(thumbnails_data) else None
                
                new_file = GroupMessageFile(message=message, file=file_obj, thumbnail=thumb)
                if hasattr(new_file, 'file_type'): new_file.file_type = f_type
                if hasattr(new_file, 'type'): new_file.type = f_type
                if hasattr(new_file, 'mime_type'): new_file.mime_type = mime
                if hasattr(new_file, 'file_name'): new_file.file_name = file_obj.name
                if hasattr(new_file, 'name'): new_file.name = file_obj.name
                new_file.save()
                
        voice_file = self.request.FILES.get('voice')
        if voice_file and not message.files.filter(file_type='audio').exists():
            new_file = GroupMessageFile(message=message, file=voice_file)
            if hasattr(new_file, 'file_type'): new_file.file_type = 'audio'
            if hasattr(new_file, 'type'): new_file.type = 'audio'
            if hasattr(new_file, 'mime_type'): new_file.mime_type = voice_file.content_type
            if hasattr(new_file, 'file_name'): new_file.file_name = voice_file.name
            if hasattr(new_file, 'name'): new_file.name = voice_file.name
            new_file.save()

        # =================================================================
        # 4. Логика копирования файлов при пересылке (Forward)
        # =================================================================
        forwarded_id = self.request.data.get('forwarded_message_id')
        forwarded_type = self.request.data.get('forwarded_message_type')

        if forwarded_id and forwarded_id not in ['null', '', None]:
            original_msg = None
            try:
                if forwarded_type == "group":
                    # Импорт убран отсюда, так как он уже есть в начале функции
                    original_msg = GroupMessage.objects.get(id=forwarded_id)
                elif forwarded_type == "product":
                    # Оставляем локальными только те импорты, которые не используются в конце функции
                    from .models import Message # Убедитесь, что импорт из правильного приложения!
                    original_msg = Message.objects.get(id=forwarded_id)
                else:
                    from .models import PrivateMessage # Убедитесь, что импорт из правильного приложения!
                    original_msg = PrivateMessage.objects.get(id=forwarded_id)
                
                if not message.text and getattr(original_msg, 'text', None):
                    message.text = original_msg.text
                    message.save(update_fields=['text'])
                
                if hasattr(original_msg, 'files'):
                    FileModel = message.files.model
                    for orig_file in original_msg.files.all():
                        new_file = FileModel(message=message)
                        for attr in ['file_type', 'type', 'file_name', 'name', 'duration', 'mime_type']:
                            if hasattr(orig_file, attr):
                                setattr(new_file, attr, getattr(orig_file, attr))
                        
                        if orig_file.file:
                            new_file.file.save(
                                orig_file.file.name.split('/')[-1],
                                orig_file.file,
                                save=False
                            )
                        new_file.save()
            except Exception as e:
                print(f"Ошибка при копировании пересланного сообщения: {e}")

        if story_id:
            message.story_id = story_id
            message.save(update_fields=['story'])

        # =================================================================
        # 🔥 5. ПРАВИЛЬНАЯ ПОДГОТОВКА ДАННЫХ ДЛЯ WEBSOCKET 🔥
        # =================================================================
        member_count = GroupMember.objects.filter(group_id=group_id).count()

        # GroupMessage теперь гарантированно виден здесь
        full_message = GroupMessage.objects.select_related("sender").prefetch_related(
            "files", "read_by"
        ).annotate(
            read_count=Count('read_by', distinct=True)
        ).annotate(
            is_read_by_all=Case(
                When(read_count__gte=member_count - 1, then=True),
                default=False,
                output_field=BooleanField()
            )
        ).get(id=message.id)

        serializer_data = GroupMessageSerializer(full_message, context={'request': self.request}).data

       # 6. Отправка в сокет группы
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"group_{full_message.group.id}",
            {
                # 🔥 ВЕРНУЛИ СТАРЫЙ ТИП: теперь ваш старый GroupChatConsumer его поймает
                "type": "group_message", 
                "message": serializer_data
            }
        )



    @action(detail=False, methods=["POST"], url_path="mark-audio-listened")
    def mark_audio_listened(self, request):
        file_id = request.data.get("file_id")

        if not file_id:
            return Response(
                {"detail": "Параметр file_id обязателен"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            msg_file = GroupMessageFile.objects.select_related("message__group").get(id=file_id)
        except GroupMessageFile.DoesNotExist:
            return Response(
                {"detail": f"Файл #{file_id} не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Проверяем, что пользователь состоит в группе
        if not GroupMember.objects.filter(group=msg_file.message.group, user=request.user).exists():
            return Response(
                {"detail": "Вы не являетесь участником этой группы"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Добавляем пользователя в список прослушавших
        if not msg_file.listened_by.filter(id=request.user.id).exists():
            msg_file.listened_by.add(request.user)

        # Заодно помечаем само сообщение как прочитанное этим пользователем
        if request.user != msg_file.message.sender and not msg_file.message.read_by.filter(id=request.user.id).exists():
            msg_file.message.read_by.add(request.user)

        return Response(
            {"status": "ok", "file_id": file_id, "is_listened": True}, 
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        user = request.user

        if message.sender != user:
            return Response(
                {"detail": "Вы можете удалить только свои сообщения."},
                status=status.HTTP_403_FORBIDDEN
            )

        group_id = message.group.id
        message.delete()

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

    # 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Гарантируем, что request попадает в контекст сериализатора
    # Это заставит DRF генерировать полные URI (https://...) при GET-запросах истории чата
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = MessageRegionChat.objects.select_related('user', 'reply_to') \
                                            .prefetch_related('files')
        
        region_id = self.request.query_params.get('region')
        if region_id and str(region_id) != '0':
            queryset = queryset.filter(region_id=region_id)
        
        return queryset.order_by('-created_at')

    # 🔥 НОВЫЙ ЭНДПОИНТ: Отметка аудио в региональном чате
    @action(detail=False, methods=['POST', 'GET', 'post'], url_path='mark-audio-listened')
    def mark_audio_listened(self, request):
        file_id = request.data.get("file_id") or request.query_params.get("file_id")

        if not file_id:
            return Response(
                {"detail": "Параметр file_id обязателен"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            msg_file = MessageRegionFile.objects.select_related("message").get(id=file_id)
        except MessageRegionFile.DoesNotExist:
            return Response(
                {"detail": f"Файл #{file_id} не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Добавляем пользователя в список прослушавших файл
        if not msg_file.listened_by.filter(id=request.user.id).exists():
            msg_file.listened_by.add(request.user)
            print(f"✅ [REGION AUDIO LISTENED] Файл #{file_id} прослушан пользователем {request.user.username}!")

        # 2. Также отмечаем само сообщение как прочитанное
        if request.user != msg_file.message.user and not msg_file.message.read_by.filter(id=request.user.id).exists():
            msg_file.message.read_by.add(request.user)

        return Response(
            {"status": "ok", "file_id": file_id, "is_listened": True}, 
            status=status.HTTP_200_OK
        )
    

        
    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        region_id = request.data.get("region")
        
        if region_id is None or region_id == '':
            return Response({"error": "Параметр region обязателен."}, status=status.HTTP_400_BAD_REQUEST)

        region_str = str(region_id)

        # 1. Находим все сообщения, которые текущий юзер еще НЕ читал
        if region_str == '0':
            unread_messages = MessageRegionChat.objects.exclude(read_by=request.user)
        else:
            unread_messages = MessageRegionChat.objects.filter(region_id=region_id).exclude(read_by=request.user)
        
        # Свои собственные сообщения не помечаем
        unread_messages = unread_messages.exclude(user=request.user)

        # 2. Собираем регионы для сокетов
        regions_to_notify = list(unread_messages.values_list('region_id', flat=True).distinct())

        updated_count = unread_messages.count()

        # 🔥 3. ИСПРАВЛЕНИЕ: Добавляем пользователя в список прочитавших (вместо update)
        for msg in unread_messages:
            msg.read_by.add(request.user)

        # 4. Рассылаем уведомления по каналам
        channel_layer = get_channel_layer()
        
        # Всегда уведомляем общий канал (для тех, кто слушает все регионы)
        async_to_sync(channel_layer.group_send)(
            "region_0",
            {
                "type": "messages_read_notify",
                "region": region_str 
            }
        )

        # Уведомляем каналы конкретных регионов
        for r_id in regions_to_notify:
            r_str = str(r_id)
            if r_str != '0':  # Чтобы не отправлять в region_0 дважды
                async_to_sync(channel_layer.group_send)(
                    f"region_{r_str}",
                    {
                        "type": "messages_read_notify",
                        "region": r_str # Передаем конкретный ID региона, чтобы фронтенд понял, где обновить UI
                    }
                )

        return Response({
            "status": "success", 
            "message": f"Помечено прочитанными сообщений: {updated_count}"
        }, status=status.HTTP_200_OK)


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.user != request.user:
            return Response(
                {"detail": "Вы не можете удалить чужое сообщение."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        region_id = instance.region_id
        message_id = instance.id

        # 🛠 ОПТИМИЗАЦИЯ: Физически удаляем файлы с диска Render перед удалением записи
        if hasattr(instance, "files"):
            for f in instance.files.all():
                if f.file:
                    f.file.delete(save=False)
                if hasattr(f, 'thumbnail') and f.thumbnail:
                    f.thumbnail.delete(save=False)
                f.delete()

        self.perform_destroy(instance)

        channel_layer = get_channel_layer()
        if str(region_id) != '0':
            async_to_sync(channel_layer.group_send)(
                f"region_{region_id}",
                {
                    "type": "delete_message_notify", 
                    "message_id": message_id,
                }
            )

        async_to_sync(channel_layer.group_send)(
            "region_0",
            {
                "type": "delete_message_notify", 
                "message_id": message_id,
            }
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request, *args, **kwargs):
        data = request.data
        files = request.FILES.getlist('uploaded_files') 
        voice = request.FILES.get('voice')
        # 🔥 1. Достаем список превью-картинок из реквеста
        thumbnails = request.FILES.getlist('thumbnail') 
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.save(user=self.request.user)

        # 🔥 2. Счетчик, чтобы сопоставлять видео и их превью по порядку
        video_index = 0 

        for f in files:
            content_type = f.content_type
            file_type = 'image'
            thumbnail_file = None # По умолчанию превью нет
            
            if 'video' in content_type:
                file_type = 'video'
                # 🔥 3. Если это видео, берем соответствующее ему превью (если оно пришло)
                if video_index < len(thumbnails):
                    thumbnail_file = thumbnails[video_index]
                    video_index += 1
            elif 'audio' in content_type:
                file_type = 'audio'

            # 🔥 4. Сохраняем файл в БД вместе с превью (если thumbnail_file == None, в БД сохранится null)
            MessageRegionFile.objects.create(
                message=message, 
                file=f, 
                type=file_type,
                thumbnail=thumbnail_file
            )
        
        if voice:
            MessageRegionFile.objects.create(message=message, file=voice, type='audio')
        
        # Перегенерация данных с request-контекстом
        full_message_data = MessageRegionChatSerializer(
            message, 
            context={'request': request} 
        ).data

        channel_layer = get_channel_layer()
        region_id = message.region_id

        if str(region_id) != '0':
            async_to_sync(channel_layer.group_send)(
                f"region_{region_id}",
                {
                    "type": "new_message_notify",
                    "message_id": message.id,
                    "message": full_message_data,
                }
            )
        
        async_to_sync(channel_layer.group_send)(
            "region_0",
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

    
    @action(detail=True, methods=["post"], url_path="remove-member")
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"detail": "Не указан user_id для удаления"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Получаем членство того, кто пытается удалить (текущий юзер)
        try:
            remover_membership = GroupMember.objects.get(group=group, user=request.user)
        except GroupMember.DoesNotExist:
            return Response({"detail": "Вы не участник группы"}, status=status.HTTP_403_FORBIDDEN)

        # Только владелец или админ могут удалять
        if remover_membership.role not in ["owner", "admin"]:
            return Response({"detail": "У вас нет прав для удаления участников"}, status=status.HTTP_403_FORBIDDEN)

        # 2. Получаем членство того, КОГО удаляют
        try:
            target_membership = GroupMember.objects.get(group=group, user_id=user_id)
        except GroupMember.DoesNotExist:
            return Response({"detail": "Пользователь не найден в группе"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Защита ролей
        if target_membership.role == "owner":
            return Response({"detail": "Владельца группы нельзя удалить"}, status=status.HTTP_403_FORBIDDEN)

        if remover_membership.role == "admin" and target_membership.role == "admin":
            return Response({"detail": "Администратор не может удалить другого администратора"}, status=status.HTTP_403_FORBIDDEN)

        # Удаляем
        target_membership.delete()
        return Response({"detail": "Участник успешно удален"}, status=status.HTTP_200_OK)


    def retrieve(self, request, *args, **kwargs):
        group = self.get_object()
        serializer = self.get_serializer(group)
        data = serializer.data

        # 🔥 Проверяем права текущего пользователя прямо при загрузке
        data['can_edit'] = GroupMember.objects.filter(
            group=group,
            user=request.user,
            role__in=["owner", "admin"]
        ).exists()

        return Response(data)

  
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
        now = timezone.now()

        following_ids = Follow.objects.filter(
            follower=user
        ).values_list("following_id", flat=True)

        unviewed_qs = Story.objects.filter(
            user_id=OuterRef("user_id"),
            is_active=True,
            expires_at__gt=now
        ).exclude(
            views__user=user
        )

        last_story_subquery = Story.objects.filter(
            user_id=OuterRef("user_id"),
            is_active=True,
            expires_at__gt=now
        ).order_by("-created_at").values("created_at")[:1]

        return (
            Story.objects.filter(
                user_id__in=following_ids,
                is_active=True,
                expires_at__gt=now
            )
            .select_related("user")
            .prefetch_related(
                # 🔥 Оптимизация просмотра
                Prefetch(
                    "views",
                    queryset=StoryView.objects.filter(user=user),
                    to_attr="user_views"
                ),
                # 🔥 Оптимизация лайков (чтобы узнать is_liked)
                Prefetch(
                    "likes",
                    queryset=StoryLike.objects.filter(user=user),
                    to_attr="user_likes"
                )
            )
            .annotate(
                has_unviewed=Exists(unviewed_qs),
                last_story_at=Subquery(last_story_subquery),
                # 🔥 Подсчет лайков
                likes_count=Count('likes', distinct=True)
            )
            .order_by("-has_unviewed", "-last_story_at", "-created_at", "user_id")
        )



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

    @action(detail=False, methods=["get"], url_path="mine")
    def my_stories(self, request):
        """Возвращает активные сторис текущего пользователя с предзагрузкой его просмотров"""
        stories = (
            Story.objects.filter(
                user=request.user,
                is_active=True,
                expires_at__gt=timezone.now()
            )
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "views",
                    queryset=StoryView.objects.filter(user=request.user),
                )
            )
            .order_by("-created_at")
        )

        serializer = StoryListSerializer(stories, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)



    # 🔥 ДОБАВЛЕНО: Эндпоинт для постановки/снятия лайка
    @action(detail=True, methods=["post"], url_path="like")
    def toggle_like(self, request, pk=None):
        """Ставит лайк, если его нет, и убирает, если он есть (Toggle)"""
        story = get_object_or_404(
            Story, 
            pk=pk, 
            is_active=True, 
            expires_at__gt=timezone.now()
        )

        like, created = StoryLike.objects.get_or_create(story=story, user=request.user)

        if not created:
            # Если лайк уже был — удаляем его (снимаем лайк)
            like.delete()
            return Response({"status": "unliked"}, status=status.HTTP_200_OK)

        # Если лайк поставили — отправляем WebSocket уведомление автору истории (если это чужая история)
        if story.user_id != request.user.id:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{story.user_id}",
                {
                    "type": "story_liked",
                    "story_id": story.id,
                    "liker_id": request.user.id,
                    "liker_username": request.user.username,
                }
            )

        return Response({"status": "liked"}, status=status.HTTP_200_OK)


    @action(detail=True, methods=["post"], url_path="view")
    def mark_viewed(self, request, pk=None):
        """Отметка о просмотре сторис (работает и для своих, и для чужих историй)"""
        story = get_object_or_404(
            Story, 
            pk=pk, 
            is_active=True, 
            expires_at__gt=timezone.now()
        )

        # ✅ Фиксируем просмотр в БД для ЛЮБОГО пользователя (включая автора)
        story_view, created = StoryView.objects.get_or_create(
            story=story,
            user=request.user
        )

        # 🔥 Отправляем WebSocket только если историю посмотрел ДРУГОЙ человек
        if created and story.user_id != request.user.id:
            channel_layer = get_channel_layer()
            viewer_data = StoryViewerSerializer(story_view, context={"request": request}).data

            async_to_sync(channel_layer.group_send)(
                f"user_{story.user_id}",
                {
                    "type": "story_viewed",
                    "story_id": story.id,
                    "viewer": viewer_data,
                }
            )

        return Response(
            {"status": "viewed" if created else "already_viewed"}, 
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"], url_path="viewers")
    def viewers(self, request, pk=None):
        """Список зрителей сторис с проверкой, кто из них поставил лайк"""
        story = get_object_or_404(Story, pk=pk, user=request.user)

        # ✅ Исключаем самого автора и проверяем наличие лайка от каждого зрителя
        views = (
            StoryView.objects.filter(story=story)
            .exclude(user=request.user)
            .select_related("user")
            .annotate(
                is_liked=Exists(
                    StoryLike.objects.filter(story=story, user=OuterRef("user_id"))
                )
            )
            .order_by("-viewed_at")
        )
        serializer = StoryViewerSerializer(views, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)



    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_story(self, request, pk=None):
        story = get_object_or_404(
            Story,
            id=pk,
            user=request.user,
            is_active=True
        )

        story.is_active = False
        story.save(update_fields=["is_active"])

        channel_layer = get_channel_layer()
        follower_ids = list(
            Follow.objects.filter(following=request.user).values_list("follower_id", flat=True)
        )
        follower_ids.append(request.user.id)

        for uid in follower_ids:
            async_to_sync(channel_layer.group_send)(
                f"user_{uid}",
                {
                    "type": "story_deleted",
                    "story_id": story.id,
                    "author_id": request.user.id,
                }
            )

        return Response({"status": "deleted"}, status=status.HTTP_200_OK)


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


    # ===================== FOLLOWERS LIST (ПОДПИСЧИКИ) =====================
    @action(detail=False, methods=["get"], url_path="followers/(?P<user_id>[^/.]+)")
    def followers(self, request, user_id=None):
        # Ищем всех, у кого following_id равен запрашиваемому юзеру (кто на него подписан)
        # select_related используем для оптимизации, чтобы не делать 100 запросов к БД (N+1 проблема)
        follows = Follow.objects.filter(following_id=user_id).select_related('follower')
        
        data = []
        for f in follows:
            user = f.follower
            
            # Формируем полный URL для аватарки (чтобы в RN картинка загрузилась по http://...)
            avatar_url = request.build_absolute_uri(user.avatar.url) if getattr(user, 'avatar', None) else None
            
            data.append({
                "id": user.id,
                "username": user.username,
                "avatar": avatar_url,
                "region": getattr(user, 'region', None)
            })
            
        return Response(data)

    # ===================== FOLLOWING LIST (ПОДПИСКИ) =====================
    @action(detail=False, methods=["get"], url_path="following/(?P<user_id>[^/.]+)")
    def following(self, request, user_id=None):
        # Ищем всех, у кого follower_id равен запрашиваемому юзеру (на кого он подписан)
        follows = Follow.objects.filter(follower_id=user_id).select_related('following')
        
        data = []
        for f in follows:
            user = f.following
            
            avatar_url = request.build_absolute_uri(user.avatar.url) if getattr(user, 'avatar', None) else None
            
            data.append({
                "id": user.id,
                "username": user.username,
                "avatar": avatar_url,
                "region": getattr(user, 'region', None)
            })
            
        return Response(data)




from firebase_admin import auth as firebase_auth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser  # Или get_user_model()


class FirebasePhoneAuthView(APIView):
    def post(self, request):
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({"error": "Токен не передан"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            phone_number = decoded_token.get('phone_number')

            if not phone_number:
                return Response({"error": "В токене нет номера телефона"}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Ищем или создаем пользователя
            user, created = CustomUser.objects.get_or_create(
                phone=phone_number,
                defaults={
                    'username': f"user_{phone_number[-4:]}",
                    'is_active': True
                }
            )

            # 2. СТРАХОВКА: Если юзер существовал, но у него пустой или дефолтный username
            if not user.username or user.username.startswith('undefined') or user.username == '':
                user.username = f"user_{phone_number[-4:]}"
                user.save(update_fields=['username'])

            # 3. ГЕНЕРИРУЕМ JWT ТОКЕНЫ НАШЕГО ПРИЛОЖЕНИЯ
            refresh = RefreshToken.for_user(user)

            # 🔥 Возвращаем плоскую структуру, ТАК ЖЕ как и в CustomTokenObtainPairView (обычный логин)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "id": user.id,              # 👈 Выносим на верхний уровень!
                "username": user.username,  # 👈 Выносим на верхний уровень!
                "phone": user.phone
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Ошибка Firebase токена: {e}")
            return Response({"error": "Невалидный токен Firebase"}, status=status.HTTP_400_BAD_REQUEST)




import requests
class WebRTCCredentialsViewSet(viewsets.ViewSet):
    """
    ViewSet для безопасной передачи конфигурации WebRTC (STUN/TURN) на фронтенд.
    """
    permission_classes = [IsAuthenticated]  # Доступы только для зарегистрированных пользователей

    def list(self, request):
        # Базовые российские и глобальные STUN-серверы (всегда бесплатные и быстрые)
        base_stun_servers = [
            {"urls": "stun:stun.yandex.ru:3478"},
            {"urls": "stun:stun.mail.ru:3478"},
            {"urls": "stun:stun.l.google.com:19302"},
        ]

        # 1. Пробуем получить свежие динамические TURN от Metered через API-ключ
        metered_api_key = getattr(settings, 'METERED_API_KEY', None)

        if metered_api_key:
            try:
                # Делаем запрос от имени сервера к API Metered
                response = requests.get(
                    f"https://metered.ca/api/v1/turn/credentials?apiKey={metered_api_key}",
                    timeout=4
                )
                if response.status_code == 200:
                    dynamic_servers = response.json()  # Metered возвращает готовый список iceServers
                    
                    return Response({
                        "iceServers": base_stun_servers + dynamic_servers
                    }, status=status.HTTP_200_OK)
            except requests.RequestException:
                # Если API Metered временно недоступен — плавно падаем на резервную статику ниже
                pass

        # 2. Фолбек: отдаем статические настройки из settings.py (твои текущие ключи)
        username = getattr(settings, 'METERED_STATIC_USERNAME', '5a717a75c6fd9d9819a5a163')
        credential = getattr(settings, 'METERED_STATIC_CREDENTIAL', 'St8H4EWIRDeMrFNj')

        static_turn_servers = [
            {"urls": "stun:stun.relay.metered.ca:80"},
            {
                "urls": "turn:global.relay.metered.ca:80",
                "username": username,
                "credential": credential,
            },
            {
                "urls": "turn:global.relay.metered.ca:80?transport=tcp",
                "username": username,
                "credential": credential,
            },
            {
                "urls": "turn:global.relay.metered.ca:443",
                "username": username,
                "credential": credential,
            },
            {
                "urls": "turns:global.relay.metered.ca:443?transport=tcp",
                "username": username,
                "credential": credential,
            },
        ]

        return Response({
            "iceServers": base_stun_servers + static_turn_servers
        }, status=status.HTTP_200_OK)