from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, RegisterView, telegram_auth, telegram_app_view, UserAddressViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'addresses', UserAddressViewSet, basename='user-address')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('telegram-auth/', telegram_auth, name='telegram-auth'),
    path('telegram-app/', telegram_app_view, name='telegram-app'),
] 