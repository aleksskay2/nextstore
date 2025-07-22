from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminsViewSet, ProductUserViewSet,SelectionObjectViewSet, RegionsViewSet
from .views import RegisterView
from .views import CategoryViewSet, FeatureProductViewSet, OwnerProductViewSet

router = DefaultRouter()
router.register(r'owner-products', OwnerProductViewSet, basename='owner-products')
router.register(r'admins', AdminsViewSet)
router.register(r'productuser', ProductUserViewSet)
router.register(r'selectionobject', SelectionObjectViewSet)
router.register(r'regions', RegionsViewSet)
router.register(r'feuture-product', FeatureProductViewSet)
router.register(r'categories', CategoryViewSet)



urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', include(router.urls)),
]
