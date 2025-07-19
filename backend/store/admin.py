from django.contrib import admin
from .models import (StoreAdmins, Users, Admins, CustomUser, SelectionObject,
                     Category, FeatureStoreAdmins, FeatureUsers, Regions, )

# Register your models here.
admin.site.register(StoreAdmins)
admin.site.register(Users)
admin.site.register(Admins)
admin.site.register(CustomUser)
admin.site.register(SelectionObject)
admin.site.register(Category)
admin.site.register(FeatureStoreAdmins)
admin.site.register(FeatureUsers)
admin.site.register(Regions)