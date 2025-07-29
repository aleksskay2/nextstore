from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import status
from rest_framework.filters import SearchFilter
from .serializers import RegisterSerializer

from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from .models import Admins, Product, SelectionObject, Regions, Category, FeatureProduct, CustomUser
from .serializers import AdminsSerializer, ProductSerializer,  SelectionObjectSerializer, RegionsSerializer
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


class OwnerProductViewSet(viewsets.ModelViewSet):
   
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(user =self.request.user, productUser= 'owner' )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user,
                                 productUser = 'owner')


class MyProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter( owner = self.request.user,
                                       productUser = 'owner')
    
    def perform_create(self, serializer):
        return serializer.save(owner = self.request.user, productUser='owner')





class AdminsViewSet(viewsets.ModelViewSet):
    queryset = Admins.objects.all()
    serializer_class = AdminsSerializer


class ProductUserViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['productName',  'price', 'address','region__nameRegions']
  
    ordering_fields = ['price']
    filterset_fields = ['region']

    def get_queryset(self):
        productUser = self.request.query_params.get('type')
        queryset = Product.objects.all()
        if productUser in ['owner', 'user']:
            return Product.objects.filter(productUser=productUser)
        return Product.objects.order_by('price')
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            #Авторизованный пользователь
            serializer.save(owner=user, productUser='owner')
        else :
            #Неавторизованный пользователь
            serializer.save(productUser = 'user')
        

class DeleteUserProductView(APIView):
    permission_classes = []

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, productUser='user')
            product.delete()
            return Response({'detail':'Товар удален'}, status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response({'detail':'Товар не найдет или нельзя его удалить!'},
                             status=status.HTTP_404_NOT_FOUND)


class EditUserProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(productUser = 'user')
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def update(self, request, *args, **kwargs):
        isinstance = self.get_object()
        serializer = self.get_serializer(
            isinstance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)






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


