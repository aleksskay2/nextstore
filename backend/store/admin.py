from django.contrib import admin
from .models import (Product,  Admins, CustomUser, SelectionObject,
                     Category, FeatureProduct, Regions, )

# Register your models here.
admin.site.register(Product)

admin.site.register(Admins)
admin.site.register(CustomUser)
admin.site.register(SelectionObject)
admin.site.register(Category)
admin.site.register(FeatureProduct)
