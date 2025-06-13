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

class OrderStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения статуса заказа на фронтенде"""
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'status', 'status_display']
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = UserAddressSerializer(read_only=True)
    status_display = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'address', 'payment_method', 'payment_method_display', 'status', 'status_display', 'created_at', 'updated_at', 'total_price', 'delivery_cost', 'items', 'comment']
        read_only_fields = ['id', 'user', 'created_at', 'total_price']
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_payment_method_display(self, obj):
        return obj.get_payment_method_display()

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