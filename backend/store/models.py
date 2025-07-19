from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    region = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.username



class Category(models.Model):
    CategoryName = models.CharField(max_length=100)

    class Meta:
        verbose_name  = "Category"
        verbose_name_plural = "Categories"


    def __str__(self):
        return self.CategoryName
    

class Regions(models.Model):
    nameRegions = models.CharField(max_length=100)


    class Meta:
        verbose_name  = "Region"
        verbose_name_plural = "Regions"

    def __str__(self):
        return self.nameRegions
    

class One(models.Model):
    nameOne = models.CharField(max_length=200)


class SelectionObject(models.Model):
    nameObject = models.CharField(max_length=100)

    class Meta:
        verbose_name  = "SelectionObject"
        verbose_name_plural = "SelectionObjects"


    def __str__(self):
        return self.nameObject




class StoreAdmins(models.Model):
    nameStoreAdmin = models.CharField(max_length=100)
    priceAdmin = models.DecimalField(max_digits=10, decimal_places=2)
    addressProductAdmin = models.CharField(max_length=100)
    imageProductAdmin = models.ImageField(upload_to='store_images')
    nameProductAdmin = models.CharField(max_length=100)
    dateUpdateAdmin = models.DateField(auto_now_add=True,  null=True, blank=True)
    weightProductAdmin = models.CharField(max_length=50, null=True, blank=True)
    regionProductAdmin = models.ForeignKey(Regions, on_delete=models.CASCADE)
    fk_Category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True )

    def __str__(self):
        return self.nameProductAdmin
    
    
    class Meta:
        verbose_name  = "FeatureStoreAdmin"
        verbose_name_plural = "FeatureStoreAdmins"


class FeatureStoreAdmins(models.Model):
    nameFeature = models.CharField(max_length=100)
    valueFeatur = models.CharField(max_length=100)
    fk_StoreAdmins = models.ForeignKey(StoreAdmins, on_delete=models.CASCADE, related_name='feature')
    
    class Meta:
        verbose_name  = "FeatureStoreAdmin"
        verbose_name_plural = "FeatureStoreAdmins"


class Admins(models.Model):
    surname = models.CharField(max_length=100)
    loginAdmin = models.CharField(max_length=100)
    mailAdmin = models.CharField(max_length=100)
    passwordAdmin = models.CharField(max_length=100)
    fk_StoreAdmin = models.ForeignKey(StoreAdmins, on_delete=models.CASCADE)


    class Meta:
        verbose_name  = "Admin"
        verbose_name_plural = "Admins"

    def __str__(self):
        return self.loginAdmin



class Users(models.Model):
    storeUserName = models.CharField(max_length=100)
    priceUser = models.DecimalField(max_digits=10, decimal_places=2)
    productNameUser = models.CharField(max_length=100)
    imageUserStore = models.ImageField(upload_to='user_images/', null=True, blank=True)
    addressUserStore = models.CharField(max_length=100)
    dateUpdateUser = models.DateField(auto_now_add=True,  null=True, blank=True)
    regionUser = models.ForeignKey(Regions,on_delete=models.CASCADE)
    fk_Category = models.ForeignKey(Category,  on_delete=models.CASCADE, null=True, blank=True  )


    class Meta:
        verbose_name  = "User"
        verbose_name_plural = "Users"



    def __str__(self):
        return self.productNameUser


class FeatureUsers(models.Model):
    nameFeature = models.CharField(max_length=100)
    valueFeature = models.CharField(max_length=255)
    fk_Users = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='features')


    class Meta:
        verbose_name  = "FeatureUser"
        verbose_name_plural = "FeatureUsers"

    def __str__(self):
        return f"{self.NameFeature}:{self.valueFeature}"



