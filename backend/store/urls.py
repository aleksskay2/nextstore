from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminsViewSet, ProductUserViewSet,SelectionObjectViewSet, RegionsViewSet
from .views import RegisterView
from .views import DeleteUserProductView
from .views import UserFullProfileView
from .views import FCMDeviceViewSet
        
from .consumers import PrivateChatConsumer , ProductChatConsumer

from .views import CustomTokenObtainPairView, MessageRegionChatViewSet, StoryViewSet, ChatSummaryViewSet, SearchUserViewSet, UserInfoView, EditUserProductViewSet
from .views import CategoryViewSet, ActivateAccountView,  FollowViewSet, FirebasePhoneAuthView, GroupMessageViewSet, SearchGroupsView, GroupViewSet, CustomUserViewSet, PrivateMessageViewSet, ProductVipViewSet, ResendActivationView, ProductReviewViewSet, CategoryFeaturesView, MessageViewSet, FeatureProductViewSet, BookmarkViewSet, OwnerProductViewSet, MyProductViewSet, LogoutView
 
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
router.register(r'products-vip', ProductVipViewSet, basename='products-vip')
router.register(r'region-chat', MessageRegionChatViewSet, basename="region-chat")
router.register(r'private-chat', PrivateMessageViewSet, basename='private-chat')
router.register(r"users", CustomUserViewSet)
router.register(r'search-user', SearchUserViewSet, basename='search-user' )
router.register( r'group-messages', GroupMessageViewSet, basename='group-messages')
router.register(r'chats-summary', ChatSummaryViewSet, basename='chats-summary')
router.register(r'groups', GroupViewSet, basename='groups')
router.register(r'stories', StoryViewSet, basename='stories')
router.register(r'devices', FCMDeviceViewSet, basename='device')
router.register(r'follows', FollowViewSet , basename='follows')



urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('firebase-phone/', FirebasePhoneAuthView.as_view(), name='firebase_phone_auth'), # 👈 Добавили сюда
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/', UserInfoView.as_view(),  name='user-info'),
    path('activate/', ActivateAccountView.as_view(), name='activate'),
    
    path('resend-activation/', ResendActivationView.as_view(), name='resend-activation'),
    path('logout/', LogoutView.as_view(), name='logout'),  # Добавляем маршр
    path('', include(router.urls)),
    path('delete-user-product/<int:pk>/', DeleteUserProductView.as_view(),
         name='delete-user-product' ),
    path('categories/<int:category_id>/features/', CategoryFeaturesView.as_view()),
    path("users/<int:user_id>/full-profile/", UserFullProfileView.as_view()),
    
    path("ws/chat/<int:user_id>/", PrivateChatConsumer.as_asgi()),
    
 
    
    path("search-groups/", SearchGroupsView.as_view(), name="search-groups"),
    


    # path("api/chats/summary/", ChatSummaryView.as_view(), name="chats/summary"),



   
]

