from django.shortcuts import render
from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import (
    CartSerializer, CartItemSerializer,
    CartItemAddSerializer, CartItemUpdateSerializer
)
import uuid

class CartMixin:
    """Миксин для работы с корзиной пользователя или гостя"""
    def get_or_create_cart(self, request):
        """Получить или создать корзину для пользователя или сессии"""
        if request.user.is_authenticated:
            # Для авторизованных пользователей - всегда ищем по user_id
            cart, created = Cart.objects.get_or_create(user=request.user, defaults={
                'session_id': None
            })
            
            # Получаем session_id из запроса
            session_id = request.session.get('cart_id')
            
            if session_id:
                try:
                    # Ищем корзины по session_id, не привязанные к пользователю
                    session_carts = Cart.objects.filter(session_id=session_id, user__isnull=True)
                    
                    for session_cart in session_carts:
                        # Объединяем каждую найденную корзину с текущей
                        self.merge_carts(session_cart, cart)
                        # Удаляем объединённую корзину
                        session_cart.delete()
                    
                    # Удаляем идентификатор корзины из сессии, так как теперь используем user_id
                    del request.session['cart_id']
                    # Сохраняем сессию
                    request.session.save()
                    
                except Exception as e:
                    print(f"Ошибка при объединении корзин: {e}")
                    # В случае ошибки продолжаем работу с текущей корзиной
            
            # Обязательно возвращаем корзину пользователя
            return cart
        else:
            # Для неавторизованных пользователей используем сессию
            session_id = request.session.get('cart_id')
            
            # Если сессия не установлена, создаём новую
            if not session_id:
                session_id = str(uuid.uuid4())
                request.session['cart_id'] = session_id
                # Сохраняем сессию
                request.session.save()
                request.session.modified = True
            
            # Пытаемся найти корзину по session_id
            try:
                cart = Cart.objects.get(session_id=session_id, user__isnull=True)
            except Cart.DoesNotExist:
                # Если не найдена, создаём новую
                cart = Cart.objects.create(
                    session_id=session_id,
                    user=None
                )
            except Cart.MultipleObjectsReturned:
                # Если нашлось несколько корзин (аномальная ситуация), берём первую
                carts = Cart.objects.filter(session_id=session_id, user__isnull=True)
                cart = carts.first()
                
                # Остальные корзины можно либо удалить, либо объединить с первой
                for other_cart in carts[1:]:
                    self.merge_carts(other_cart, cart)
                    other_cart.delete()
        
        return cart
    
    def merge_carts(self, source_cart, target_cart):
        """Объединение двух корзин"""
        for source_item in source_cart.items.all():
            try:
                # Проверяем, есть ли уже такой товар в целевой корзине
                target_item = target_cart.items.get(product=source_item.product)
                # Если есть, увеличиваем количество
                target_item.quantity += source_item.quantity
                target_item.save()
            except CartItem.DoesNotExist:
                # Если нет, создаем новый элемент
                source_item.pk = None  # Сбрасываем первичный ключ для создания нового объекта
                source_item.cart = target_cart
                source_item.save()


class CartView(CartMixin, views.APIView):
    """API для работы с корзиной"""
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Получить текущую корзину"""
        # Получаем или создаем корзину
        cart = self.get_or_create_cart(request)
        
        # Проверяем, авторизован ли пользователь
        if request.user.is_authenticated and cart.user != request.user:
            # Если пользователь авторизован, но корзина не привязана к нему,
            # привязываем корзину к пользователю
            cart.user = request.user
            cart.save()
        
        # Возвращаем сериализованные данные корзины
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemAddView(CartMixin, views.APIView):
    """API для добавления товара в корзину"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """Добавить товар в корзину"""
        serializer = CartItemAddSerializer(data=request.data)
        if serializer.is_valid():
            # Получаем или создаем корзину
            cart = self.get_or_create_cart(request)
            
            # Проверяем, авторизован ли пользователь
            if request.user.is_authenticated and cart.user != request.user:
                # Если пользователь авторизован, но корзина не привязана к нему,
                # привязываем корзину к пользователю
                cart.user = request.user
                cart.save()
            
            product = serializer.validated_data['product_id']
            quantity = serializer.validated_data['quantity']
            
            # Проверяем, есть ли уже такой товар в корзине
            try:
                cart_item = cart.items.get(product=product)
                cart_item.quantity += quantity
                cart_item.save()
            except CartItem.DoesNotExist:
                cart_item = CartItem.objects.create(
                    cart=cart, 
                    product=product, 
                    quantity=quantity
                )
            
            # Возвращаем обновленную корзину
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartItemUpdateView(CartMixin, views.APIView):
    """API для обновления количества товара в корзине"""
    permission_classes = [AllowAny]
    
    def put(self, request, *args, **kwargs):
        """Обновить количество товара в корзине"""
        item_id = kwargs.get('item_id')
        
        # Получаем или создаем корзину
        cart = self.get_or_create_cart(request)
        
        # Проверяем, авторизован ли пользователь
        if request.user.is_authenticated and cart.user != request.user:
            # Если пользователь авторизован, но корзина не привязана к нему,
            # привязываем корзину к пользователю
            cart.user = request.user
            cart.save()
        
        try:
            cart_item = cart.items.get(id=item_id)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Товар не найден в корзине"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CartItemUpdateSerializer(data=request.data)
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            
            if quantity == 0:
                # Если количество равно 0, удаляем товар из корзины
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
            
            # Возвращаем обновленную корзину
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartItemDeleteView(CartMixin, views.APIView):
    """API для удаления товара из корзины"""
    permission_classes = [AllowAny]
    
    def delete(self, request, *args, **kwargs):
        """Удалить товар из корзины"""
        item_id = kwargs.get('item_id')
        
        # Получаем или создаем корзину
        cart = self.get_or_create_cart(request)
        
        # Проверяем, авторизован ли пользователь
        if request.user.is_authenticated and cart.user != request.user:
            # Если пользователь авторизован, но корзина не привязана к нему,
            # привязываем корзину к пользователю
            cart.user = request.user
            cart.save()
        
        try:
            cart_item = cart.items.get(id=item_id)
            cart_item.delete()
            
            # Возвращаем обновленную корзину
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Товар не найден в корзине"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class CartClearView(CartMixin, views.APIView):
    """API для очистки корзины"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """Очистить корзину (POST метод)"""
        return self.clear_cart(request)
    
    def delete(self, request, *args, **kwargs):
        """Очистить корзину (DELETE метод)"""
        return self.clear_cart(request)
    
    def clear_cart(self, request):
        """Метод для очистки корзины"""
        # Получаем или создаем корзину
        cart = self.get_or_create_cart(request)
        
        # Проверяем, авторизован ли пользователь
        if request.user.is_authenticated and cart.user != request.user:
            # Если пользователь авторизован, но корзина не привязана к нему,
            # привязываем корзину к пользователю
            cart.user = request.user
            cart.save()
        
        # Удаляем все товары из корзины
        cart.items.all().delete()
        
        # Возвращаем пустую корзину
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
