from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminsViewSet, ProductUserViewSet,SelectionObjectViewSet, RegionsViewSet
from .views import RegisterView
from .views import CustomTokenObtainPairView, UserInfoView
from .views import CategoryViewSet, FeatureProductViewSet, OwnerProductViewSet, MyProductViewSet

router = DefaultRouter()
router.register(r'owner-products', OwnerProductViewSet, basename='owner-products')
router.register(r'admins', AdminsViewSet)
router.register(r'products', ProductUserViewSet)
router.register(r'selectionobject', SelectionObjectViewSet)
router.register(r'regions', RegionsViewSet)
router.register(r'feuture-product', FeatureProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'my-products', MyProductViewSet, basename='my-products')



urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/', UserInfoView.as_view(), name='user-info'),
    path('', include(router.urls)),
]
