from rest_framework import serializers
from .models import Admins, StoreAdmins, Users, SelectionObject, Regions, Category, FeatureStoreAdmins ,FeatureUsers
from django.contrib.auth import get_user_model


User = get_user_model()


class CategorySerializzer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'CategoryName']


class FeatureStoreAdminSerializer(serializers.ModelSerializer):
    class Meta: 
        model  = FeatureStoreAdmins
        fields = ['id','nameFeature','valueFeature','fk_storeAdmins']


class FeatureUsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureUsers
        fields = ['id', 'nameFeature', 'valueFeature', 'fk_Users']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user 



class RegionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regions
        fields = '__all__'
    

class StoreAdminsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreAdmins
        fields = '__all__'


class AdminsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admins
        fields = '__all__'


class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'

    
class SelectionObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionObject
        fields = '__all__'


