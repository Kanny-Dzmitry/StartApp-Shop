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
            # Для авторизованных пользователей
            cart, created = Cart.objects.get_or_create(user=request.user, defaults={
                'session_id': None
            })
            # Если пользователь авторизовался и у него была корзина по сессии,
            # то можно объединить корзины
            session_id = request.session.get('cart_id')
            if session_id:
                try:
                    session_cart = Cart.objects.get(session_id=session_id, user__isnull=True)
                    # Объединяем корзины
                    self.merge_carts(session_cart, cart)
                    # Удаляем старую корзину
                    session_cart.delete()
                    # Удаляем идентификатор корзины из сессии
                    del request.session['cart_id']
                except Cart.DoesNotExist:
                    pass
        else:
            # Для неавторизованных пользователей используем сессию
            session_id = request.session.get('cart_id')
            if not session_id:
                session_id = str(uuid.uuid4())
                request.session['cart_id'] = session_id
            
            cart, created = Cart.objects.get_or_create(session_id=session_id, defaults={
                'user': None
            })
        
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
        cart = self.get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemAddView(CartMixin, views.APIView):
    """API для добавления товара в корзину"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """Добавить товар в корзину"""
        serializer = CartItemAddSerializer(data=request.data)
        if serializer.is_valid():
            cart = self.get_or_create_cart(request)
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
        cart = self.get_or_create_cart(request)
        
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
        cart = self.get_or_create_cart(request)
        
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
        """Очистить корзину"""
        cart = self.get_or_create_cart(request)
        cart.items.all().delete()
        
        # Возвращаем пустую корзину
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
