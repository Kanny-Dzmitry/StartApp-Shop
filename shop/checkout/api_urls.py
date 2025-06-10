from django.urls import path
from . import views

app_name = 'checkout_api'

urlpatterns = [
    # API для страницы оформления заказа
    path('', views.CheckoutView.as_view(), name='checkout'),
] 