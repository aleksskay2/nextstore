from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import status
from rest_framework.filters import SearchFilter
from .serializers import RegisterSerializer
from django.shortcuts import render
from rest_framework import viewsets
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


class OwnerProductViewSet(viewsets.ModelViewSet):
   
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(user =self.request.user, productType= 'owner' )

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user,
                                 productType = 'owner')


class MyProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter( owner = self.request.user, productType = 'owner')
    
    def perform_create(self, serializer):
        return serializer.save(owner = self.request.user, productType='owner')



class AdminsViewSet(viewsets.ModelViewSet):
    queryset = Admins.objects.all()
    serializer_class = AdminsSerializer


class ProductUserViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    filterBackends = [SearchFilter]
    searchFields = ['productТame',  'price', 'address']

    def get_queryset(self):
        productType = self.request.query_params.get('type')
        if productType in ['owner', 'user']:
            return Product.objects.filter(productType=productType)
        return Product.objects.all()
        

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


