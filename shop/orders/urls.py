from django.urls import path
from .views import OrderViewSet, DeliverySettingsView

urlpatterns = [
    path('create/', OrderViewSet.as_view({'post': 'create_order'}), name='create_order'),
    path('', OrderViewSet.as_view({'get': 'list'}), name='orders_list'),
    path('<int:pk>/', OrderViewSet.as_view({'get': 'retrieve'}), name='order_detail'),
    path('delivery/settings/', DeliverySettingsView.as_view(), name='delivery_settings'),
] 