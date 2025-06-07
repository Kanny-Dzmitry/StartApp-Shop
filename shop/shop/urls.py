"""
URL configuration for shop project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken import views
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import telegram_app_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api-token-auth/', views.obtain_auth_token),  # Для получения токена аутентификации
    path('', telegram_app_view, name='telegram-app'),  # Главная страница - Telegram Mini App
    path('catalog/', include('catalog.urls', namespace='catalog')),  # URL для каталога товаров
    path('api/catalog/', include('catalog.api_urls', namespace='catalog_api')),  # API URL для каталога товаров
    path('api/cart/', include('cart.api_urls', namespace='cart_api')),  # API URL для корзины
]

# Добавляем обработку статических файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
