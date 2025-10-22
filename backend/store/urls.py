from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminsViewSet, ProductUserViewSet,SelectionObjectViewSet, RegionsViewSet
from .views import RegisterView
from .views import DeleteUserProductView
from .views import CustomTokenObtainPairView, UserInfoView, EditUserProductViewSet
from .views import CategoryViewSet, ActivateAccountView, ResendActivationView, ProductReviewViewSet, CategoryFeaturesView, MessageViewSet, FeatureProductViewSet, BookmarkViewSet, OwnerProductViewSet, MyProductViewSet, LogoutView
 
router = DefaultRouter()
router.register(r'owner-products', OwnerProductViewSet, basename='owner-products')
router.register(r'admins', AdminsViewSet)
router.register(r'products', ProductUserViewSet)
router.register(r'edit-user-products', EditUserProductViewSet, basename='edit-user-products')
router.register(r'selectionobject', SelectionObjectViewSet)
router.register(r'regions', RegionsViewSet)
router.register(r'feuture-product', FeatureProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'my-products', MyProductViewSet, basename='my-products')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'product-reviews', ProductReviewViewSet, basename='product-review')



urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/', UserInfoView.as_view(), name='activate'),
    path('activate/', ActivateAccountView.as_view(), name='user-info'),
    
    path('resend-activation/', ResendActivationView.as_view(), name='resend-activation'),
    path('logout/', LogoutView.as_view(), name='logout'),  # Добавляем маршр
    path('', include(router.urls)),
    path('delete-user-product/<int:pk>/', DeleteUserProductView.as_view(),
         name='delete-user-product' ),
    path('categories/<int:category_id>/features/', CategoryFeaturesView.as_view()),

   
]

