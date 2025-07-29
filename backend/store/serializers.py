from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Admins, Product,  SelectionObject, Regions, Category, FeatureProduct, CustomUser
from django.contrib.auth import get_user_model


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
    class Meta:
        model = Category
        fields = ['id', 'CategoryName']



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
    

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['owner', 'productUser']


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


