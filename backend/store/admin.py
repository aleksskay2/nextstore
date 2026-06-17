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





# Замени 'store.models' и 'Region' на твое приложение и модель регионов
from store.models import Regions 

# Список регионов, которые нужно добавить
regions_list = [
    "Москва", 
    "Санкт-Петербург", 
    "Краснодарский край", 
    "Ростовская область",
    "Ставропольский край",
    "Республика Дагестан",
    "Чеченская Республика"
]

# Цикл get_or_create защитит от дубликатов, если какие-то регионы уже есть
for name in regions_list:
    obj, created = Regions.objects.get_or_create(name=name)
    if created:
        print(print(f"✅ Регион '{name}' успешно добавлен"))
    else:
        print(f"ℹ️ '{name}' уже существует")

# Выходим из шелла
exit()