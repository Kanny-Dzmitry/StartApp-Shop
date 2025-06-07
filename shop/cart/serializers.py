from rest_framework import serializers
from .models import Cart, CartItem
from catalog.serializers import ProductSerializer
from catalog.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    """Сериализатор для элементов корзины"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(available=True),
        write_only=True, source='product'
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price']


class CartSerializer(serializers.ModelSerializer):
    """Сериализатор для корзины"""
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CartItemAddSerializer(serializers.Serializer):
    """Сериализатор для добавления товара в корзину"""
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(available=True)
    )
    quantity = serializers.IntegerField(default=1, min_value=1)


class CartItemUpdateSerializer(serializers.Serializer):
    """Сериализатор для обновления количества товара в корзине"""
    quantity = serializers.IntegerField(min_value=0)  # 0 для удаления элемента 