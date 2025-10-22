from django.contrib import admin
from .models import (Product,  Admins, CustomUser, SelectionObject,
                     Category, FeatureProduct, Regions, FeatureTemplate)

# Register your models here.

admin.site.register(Category)
# class CategoryAdmin(admin.ModelAdmin):
#     list_display = ('CategoryName', 'parent')
#     list_filter = ('parent',)

admin.site.register(Product)

admin.site.register(Admins)
admin.site.register(CustomUser)
admin.site.register(SelectionObject)

admin.site.register(FeatureProduct)
admin.site.register(FeatureTemplate)
admin.site.register(Regions)
