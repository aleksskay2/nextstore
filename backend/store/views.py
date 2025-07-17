from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter
from .serializers import RegisterSerializer
from django.shortcuts import render
from rest_framework import viewsets
from .models import Admins, StoreAdmins, Users, SelectionObject, Regions, Users, Category, FeatureUsers, FeatureStoreAdmins
from .serializers import AdminsSerializer, StoreAdminsSerializer, UsersSerializer, SelectionObjectSerializer, RegionsSerializer
from .serializers import (
    CategorySerializzer,
    FeatureStoreAdminSerializer,
    FeatureUsersSerializer
)


# Create your views here.



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message:", "Пользователь"},status=status.HTTP_201_CREATED)
        return repr(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def index(request):
    return render(request,'index.html')

class AdminsViewSet(viewsets.ModelViewSet):
    queryset = Admins.objects.all()
    serializer_class = AdminsSerializer


class StoreAdminsViewSet(viewsets.ModelViewSet):
    queryset = StoreAdmins.objects.all()
    serializer_class = StoreAdminsSerializer
    filterBackends = [SearchFilter]
    searchFields = ['nameProductAdmin', 'regionProductAdmin', ' priceAdmin', 'addressProductAdmin']


class UsersViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UsersSerializer
    filterBackend = [SearchFilter]
    searchFields = ['productNameUser', 'priceUser', 'addressStoreUser', 'regionUser']


class SelectionObjectViewSet(viewsets.ModelViewSet):
    queryset = SelectionObject.objects.all()
    serializer_class = SelectionObjectSerializer


class RegionsViewSet(viewsets.ModelViewSet):
    queryset = Regions.objects.all()
    serializer_class = RegionsSerializer
    


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()


class FeatureStoreAdminsViewSet(viewsets.ModelViewSet):
    queryset = FeatureStoreAdmins.objects.all()
    serializer_class = FeatureStoreAdminSerializer


class FeutureUsersViewSet(viewsets.ModelViewSet):
    queryset = FeatureUsers.objects.all()
    serializer_class = FeatureUsers

