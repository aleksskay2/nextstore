from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminsViewSet, StoreAdminsViewSet, UsersViewSet,SelectionObjectViewSet, RegionsViewSet
from .views import RegisterView
from .views import CategoryViewSet, FeatureStoreAdminsViewSet, FeutureUsersViewSet

router = DefaultRouter()
router.register(r'admins', AdminsViewSet)
router.register(r'store-admins', StoreAdminsViewSet)
router.register(r'users', UsersViewSet)
router.register(r'selectionobject', SelectionObjectViewSet)
router.register(r'regions', RegionsViewSet)
router.register(r'feature-users', FeutureUsersViewSet)
router.register(r'feuture-store-admins', FeatureStoreAdminsViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', include(router.urls)),
]
