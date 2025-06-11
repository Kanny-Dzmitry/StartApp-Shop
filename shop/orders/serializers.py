from rest_framework import serializers
from .models import Order, OrderItem, DeliverySettings
from accounts.serializers import UserAddressSerializer
from catalog.models import Product

class DeliverySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySettings
        fields = ['free_delivery_threshold', 'delivery_cost']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'total_price']
        read_only_fields = ['id', 'product_name', 'product_price', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = UserAddressSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'address', 'payment_method', 'status', 'created_at', 'updated_at', 'total_price', 'delivery_cost', 'items', 'comment']
        read_only_fields = ['id', 'user', 'created_at', 'total_price']

class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHODS)
    user_info = serializers.DictField(required=False)  # Дополнительная информация о пользователе
    total_items = serializers.IntegerField(required=False)  # Общее количество товаров
    total_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    comment = serializers.CharField(required=False, allow_blank=True)  # Комментарий к заказу
    delivery_cost = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    
    def validate_address_id(self, value):
        user = self.context['request'].user
        try:
            user.user_addresses.get(id=value)
        except:
            raise serializers.ValidationError("Указанный адрес не найден")
        return value 