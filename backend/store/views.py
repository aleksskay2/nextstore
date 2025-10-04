from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from django.db.models import Q, Max, Count, When, IntegerField, Case, F
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination


from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import status
from rest_framework.filters import SearchFilter
from .serializers import RegisterSerializer

from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, permissions, serializers
from .models import Admins, Product, Message,MessageImage, ProductImage, ProductReview, Bookmark,SelectionObject, Regions, Category, FeatureProduct, CustomUser
from .serializers import AdminsSerializer, ProductListSerializer, ProductDetailSerializer, ProductImagesSerializer, ProductReviewSerializer, MessageSerializer, BookmarkSerializer,  SelectionObjectSerializer, RegionsSerializer
from .serializers import (
    CategorySerializzer,
    FeatureProductSerializer,
   
)


# Create your views here.


def index(request): 
       return render(request,'index.html')


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


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)





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


class ProductUserViewSet(viewsets.ModelViewSet):
  
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['productName',  'price', 'address','region__nameRegions']
    pagination_class = ProductPagination
  
    ordering_fields = ['price']
    filterset_fields = ['region']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer







    def get_queryset(self):
        productUser = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        queryset = Product.objects.all()
       
        if productUser in ['owner', 'user']:
            queryset = queryset.filter(productUser=productUser)
        
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                subcategories =  category.get_all_subcategories()
                all_category_ids = [category.id] + [subcat.id for subcat in subcategories]
                queryset = queryset.filter(category_id__in=all_category_ids)
            
            except Category.DoesNotExist:
                pass
        return queryset.order_by('price')



        # поиск по частичному совпадению 
        # def get_queryset(self):
        #     productUser = self.request.query_params.get('type')
        #     category_id = self.request.query_params.get('category')
        #     queryset = Product.objects.all()
            
        #     if productUser in ['owner', 'user']:
        #         queryset = queryset.filter(productUser=productUser)
            
        #     if category_id:
        #         try:
        #             category = Category.objects.get(id=category_id)
        #             subcategories =  category.get_all_subcategories()
        #             all_category_ids = [category.id] + [subcat.id for subcat in subcategories]
        #             queryset = queryset.filter(category_id__in=all_category_ids)
                
        #         except Category.DoesNotExist:
        #             pass
            
        
            # search_query = self.request.query_params.get('search')
            # if search_query:
            #     vector = SearchVector('productName', 'address', 'region_nameRegions')
            #     queryset = queryset.annotate(rank=SearchRank(vector, Value(search_query)))
            #     return queryset.order_by('-rank', 'price')
            # return queryset.order_by('price')
            




    
      
    # action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    # def upload_images(self, request, pk=None):
    #     product = self.get_object()
        
    #     if product.owner != request.user:
    #         return Response({'error': "Изображение можно добавлять только для своих товаров."},
    #                         status=status.HTTP_403_FORBIDDEN)

    #     images = request.FILES.getlist('product_images')
    #     if not images:
    #         return Response({'error': 'Файлы не загружены.'}, status=status.HTTP_400_BAD_REQUEST)
        
    #     product_images_objs = []
    #     for img in images:
    #         obj = ProductImage.objects.create(product=product, image=img)
       
    

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            #Авторизованный пользователь
            product = serializer.save(owner=user, productUser='owner')
        else :
            #Неавторизованный пользователь
            user_phone = self.request.data.get('user_phone')
            product = serializer.save(productUser = 'user', user_phone=user_phone)
        
        main_image = self.request.FILES.get('main_image')
        if main_image:
            product.main_image = main_image
            product.save()

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
    
    @action(detail=False, methods=['delete'], url_path=r'remove(?P<pk>\d+)') 
    def remove_bookmark(self, request, pk=None):
        try:
            book = Bookmark.objects.get(user=request.user, product_id=pk)
            book.delete()
            return Response({'message':'Удалено из избранного'}, status=status.HTTP_204_NO_CONTENT)
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
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        receiver = product.owner
        
        if not receiver:
            raise serializers.ValidationError('У этого товара нет владельца')
        
        if receiver == self.request.user:
            raise serializers.ValidationError('Нельзя писать сообщение самому себе')
        serializer.save(sender=self.request.user, receiver=receiver)


    @action(detail=False, methods=['get'], url_path='unread_count')
    def unread_count(self, request):
        user = request.user
        count = Message.objects.filter(receiver=user, is_read=False).count()
        return Response({'unread_count':count})

    @action(detail=False, methods=['post'], url_path='mark_as_read')
    def mark_as_read(self, request):
        user = request.user
        product_id = request.data.get('product_id')
        sender_id = request.data.get('sender_id')

        if not product_id or not sender_id:
            return Response({'error':'product_id and sender_id required'}, status=400)

        updated = Message.objects.filter(
            sender_id=sender_id,
            receiver=user,
            product_id=product_id,
            is_read=False,
        ).update(is_read=True)

        return Response({'updated':updated})


    @action(detail=False, methods=['get'])
    # def chats(self, request):
    #     user = request.user

    #     #выбираем все чаты, где есть user
    #     messages = (
    #         Message.objects.filter(Q(sender=user) | Q(receiver=user))
    #         .select_related('product', 'sender', 'receiver')
    #         .order_by('product_id', '-created_at')
    #     )

    #     # оставляем только последнее сообщение в чате (по тавору)
    #     last_messsages = {}
    #     for msg in messages:
    #         if msg.product_id not in last_messsages:
    #             last_messsages[msg.product_id] = msg
        
    #     serializer = self.get_serializer(last_messsages.values(), many=True)
    #     return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def inbox(self, request):
        messages = Message.objects.filter(receiver=request.user
                                          ).select_related('sender','product').order_by('-created_at')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)


    # @action(detail=False, methods=['get'], url_path=r'dialog/(?P<user1_id>\d+)/(?P<user2_id>\d+)/(?P<product_id>\d+)')
    # def dialog(self, request, user1_id=None, user2_id=None, product_id=None):
          
    #         messages = (Message.objects.filter(
    #         Q(sender_id=user1_id, receiver_id=user2_id, product_id=product_id)|
    #         Q(sender_id=user2_id, receiver_id=user1_id, product_id=product_id)).order_by('-created_at')[:4]
    #         )
    #         messages = list(messages[::-1]) # в обратно порядке

    #         serializer = self.get_serializer(messages, many=True)
    #         return Response(serializer.data)

        
    @action(
    detail=False,
    methods=['get'],
    url_path=r'dialog/(?P<user1_id>\d+)/(?P<user2_id>\d+)/(?P<product_id>\d+)'
)
    def dialog(self, request, user1_id=None, user2_id=None, product_id=None):
        limit = int(request.query_params.get('limit', 10))
        offset = int(request.query_params.get('offset', 10))

        # выбираем сообщения между двумя юзерами по товару
        qs = messages = (
            Message.objects.filter(
                Q(sender_id=user1_id, receiver_id=user2_id, product_id=product_id) |
                Q(sender_id=user2_id, receiver_id=user1_id, product_id=product_id)
            )
            .order_by('-created_at') # например, последние 10
        )
        total_count = qs.count()
        # переворачиваем порядок, чтобы были "снизу вверх"
        messages = list(qs[offset:offset+limit][::-1])

        serializer = self.get_serializer(messages, many=True, context={'request':request})

        # считаем непрочитанные для текущего пользователя
        unread_count = Message.objects.filter(
            receiver=request.user,
            sender_id=user1_id if str(request.user.id) != str(user1_id) else user2_id,
            product_id=product_id,
            is_read=False
        ).count()

        return Response({
            "messages": serializer.data,
            'total':total_count,
            "unread_count": unread_count
        })    
    


     
       

       
    @action(detail=False, methods=['get'], url_path='chats')
    def chats(self, request):
        user_id = request.user.id

        dialogs = (
            Message.objects.filter(Q(sender_id= user_id) | Q(receiver_id=user_id))
            .values('product_id', 'sender_id', 'receiver_id')
            .annotate(
                companion_id = Case(
                    When (sender_id=user_id, then=F('receiver_id')),
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
            .select_related('product', 'sender', 'receiver'))
        messages_map = {m.id: m for m in last_messages}

        response_data = []
        for d in dialogs:
            msg = messages_map.get(d['last_message_id'])
            if msg:
                img_url = None
                if msg.product and msg.product.main_image:
                    img_url = request.build_absolute_uri(msg.product.main_image.url)
                response_data.append({
                    'product_id':d['product_id'],
                    'product_name':msg.product.productName if msg.product else None,
                    'product_image':img_url,
                    'companion_id':d['companion_id'],
                    'current_user_id':user_id,
                    'last_message':msg.text,
                    'last_message_at':msg.created_at,
                    'unread_count':d['unread_count']
                })
        response_data.sort(key=lambda x: x['last_message_at'], reverse=True)
        return Response(response_data)




    @action(detail=False, methods=['post'], url_path='send')
    def send_message(self, request):
        print("DEBUG POST data:", request.data)
        receiver_id = request.data.get('receiver_id')
        product_id = request.data.get('product')
       
        text = request.data.get('text')
        if not receiver_id  or not product_id:
            return Response({'error':"receiver_id  обязательный"}, status=400)

        try:
            receiver_id = int(receiver_id)
            product_id = int(product_id)
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error':' Товар не найден'}, status=400)
        if int(receiver_id) == request.user.id:
            return Response({'error':'Нельзя отправлять сообщение самому себе'}, status=400)

        message = Message.objects.create(
            sender=request.user,
            receiver_id = receiver_id,
            product=product,
            text=text
        )

        images = request.FILES.getlist('images')
        for img in images:
            MessageImage.objects.create(message=message, image=img)


        return Response(self.get_serializer(message).data)


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



class OwnerProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(productUser = 'owner')
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    # def get_queryset(self):
    #     return Product.objects.filter(owner=self.request.user, productType='owner')
    
    def perform_create(self, serializer ):
        product = serializer.save(owner=self.request.user, productUser='owner')

        # Работаем с файлами после сохранения
        main_image = self.request.FILES.get('main_image')
        if main_image:
            product.main_image = main_image
            product.save()

        uploaded_images = self.request.FILES.getlist('product_images')
        if uploaded_images:
            for img in uploaded_images:
                ProductImage.objects.create(product=product, image=img)

        if not main_image:
            product.main_image = uploaded_images[0]
            product.save()


    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        main_image = request.FILES.get('main_image')
        if  main_image:
            instance.main_image =  main_image
            instance.save()
        

        uploaded_images = request.FILES.getlist('product_images')
        if uploaded_images:
            instance.images.all().delete()

            for img in uploaded_images:
                ProductImage.objects.create(product=instance, image=img)
        
            if not main_image:
                instance.main_image = uploaded_images[0]
                instance.save()

        return Response(self.get_serializer(instance).data)



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


