from django.urls import path
from . import views

app_name = 'cart_api'

urlpatterns = [
    # API для корзины
    path('', views.CartView.as_view(), name='cart'),
    # API для добавления товара в корзину
    path('add/', views.CartItemAddView.as_view(), name='cart_add'),
    # API для обновления количества товара в корзине
    path('update/<int:item_id>/', views.CartItemUpdateView.as_view(), name='cart_update'),
    # API для удаления товара из корзины
    path('delete/<int:item_id>/', views.CartItemDeleteView.as_view(), name='cart_delete'),
    # API для очистки корзины
    path('clear/', views.CartClearView.as_view(), name='cart_clear'),
] 