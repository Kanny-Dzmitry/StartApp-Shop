from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from .models import Order, OrderItem, DeliverySettings
from .serializers import OrderSerializer, OrderCreateSerializer, DeliverySettingsSerializer
from accounts.models import UserAddress
from catalog.models import Product
from django.core.exceptions import ObjectDoesNotExist
from cart.models import Cart, CartItem
from cart.serializers import CartSerializer
from decimal import Decimal

# Create your views here.

class DeliverySettingsView(APIView):
    """Представление для получения настроек доставки"""
    
    def get(self, request):
        settings = DeliverySettings.get_settings()
        serializer = DeliverySettingsSerializer(settings)
        return Response(serializer.data)

# Представление для создания и просмотра заказов
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Пользователь видит только свои заказы
        return Order.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Создание нового заказа из корзины пользователя"""
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Получаем корзину пользователя
            cart_response = self.get_cart(request)
            if not cart_response.status_code == 200:
                return Response({"error": "Не удалось получить данные корзины"}, status=status.HTTP_400_BAD_REQUEST)
            
            cart_data = cart_response.data
            
            # Проверяем, что в корзине есть товары
            if not cart_data.get('items', []):
                return Response({"error": "Корзина пуста"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Получаем адрес доставки
            try:
                address = UserAddress.objects.get(user=request.user, id=serializer.validated_data['address_id'])
            except ObjectDoesNotExist:
                return Response({"error": "Указанный адрес не найден"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Получаем настройки доставки
            delivery_settings = DeliverySettings.get_settings()
            
            # Рассчитываем стоимость доставки
            cart_total = Decimal(cart_data.get('total_price', 0))
            delivery_cost = Decimal(0)
            
            # Если сумма заказа меньше порога бесплатной доставки, добавляем стоимость доставки
            if cart_total < delivery_settings.free_delivery_threshold:
                delivery_cost = delivery_settings.delivery_cost
            
            # Общая сумма заказа с учетом доставки
            total_price = cart_total + delivery_cost
            
            # Создаем заказ в транзакции
            with transaction.atomic():
                # Создаем заказ с полной информацией
                order = Order.objects.create(
                    user=request.user,
                    address=address,
                    payment_method=serializer.validated_data['payment_method'],
                    total_price=total_price,
                    delivery_cost=delivery_cost,
                    status='new',
                    comment=serializer.validated_data.get('comment', '')  # Сохраняем комментарий
                )
                
                # Добавляем товары из корзины в заказ с сохранением всех деталей
                for item in cart_data.get('items', []):
                    try:
                        product = Product.objects.get(id=item['product']['id'])
                        # Сохраняем детальную информацию о каждом товаре
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            product_name=product.name,
                            product_price=product.price,
                            quantity=item['quantity']
                        )
                    except ObjectDoesNotExist:
                        # Если продукт не найден, пропускаем его
                        continue
                
                # Очищаем корзину пользователя
                self.clear_cart(request)
                
                # Возвращаем подробную информацию о созданном заказе
                return Response({
                    "id": order.id,
                    "status": "Новый",
                    "status_code": "new",
                    "message": "Ваш заказ успешно принят! Спасибо за покупку.",
                    "redirect_to": "/",  # Перенаправление на главную страницу
                    "total_price": str(order.total_price),
                    "delivery_cost": str(order.delivery_cost),
                    "created_at": order.created_at.strftime("%d.%m.%Y %H:%M"),
                    "payment_method": order.get_payment_method_display(),
                    "items_count": order.items.count(),
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_cart(self, request):
        """Получение данных корзины пользователя"""
        # Получаем корзину пользователя напрямую из базы данных
        try:
            # Для авторизованных пользователей ищем корзину по user_id
            cart = Cart.objects.get(user=request.user)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Cart.DoesNotExist:
            # Если корзина не найдена, возвращаем пустую корзину
            return Response({"items": [], "total_price": "0.00"})
        except Cart.MultipleObjectsReturned:
            # Если нашлось несколько корзин, берём первую
            cart = Cart.objects.filter(user=request.user).first()
            serializer = CartSerializer(cart)
            return Response(serializer.data)
    
    def clear_cart(self, request):
        """Очистка корзины пользователя"""
        # Очищаем корзину пользователя напрямую из базы данных
        try:
            # Для авторизованных пользователей ищем корзину по user_id
            cart = Cart.objects.get(user=request.user)
            # Удаляем все товары из корзины
            CartItem.objects.filter(cart=cart).delete()
            return Response({"status": "success"})
        except Cart.DoesNotExist:
            # Если корзина не найдена, ничего не делаем
            return Response({"status": "success"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
