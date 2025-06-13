from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Address, UserAddress

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'district', 'street', 'house_number', 'floor', 'apartment', 'full_address']

class UserAddressSerializer(serializers.ModelSerializer):
    address = AddressSerializer()
    
    class Meta:
        model = UserAddress
        fields = ['id', 'address', 'is_default', 'name']
        
    def create(self, validated_data):
        address_data = validated_data.pop('address')
        address = Address.objects.create(**address_data)
        return UserAddress.objects.create(address=address, **validated_data)
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Обновляем поля UserAddress
        instance.is_default = validated_data.get('is_default', instance.is_default)
        instance.name = validated_data.get('name', instance.name)
        
        # Обновляем поля Address
        if address_data:
            address = instance.address
            for attr, value in address_data.items():
                setattr(address, attr, value)
            address.save()
            
        instance.save()
        return instance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают."})
        return attrs
        
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class OrderBriefSerializer(serializers.Serializer):
    """Краткая информация о заказе для отображения в профиле"""
    id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    status_display = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    def get_status_display(self, obj):
        """Получение отображаемого значения статуса заказа"""
        return dict(obj.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_items_count(self, obj):
        return obj.items.count()
        
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    address = AddressSerializer(required=False)
    addresses = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'first_name', 'last_name', 'phone_number', 'address', 'addresses', 'recent_orders']
        read_only_fields = ['id']
    
    def get_addresses(self, obj):
        """Получает список адресов пользователя, безопасно обрабатывая случай отсутствия адресов."""
        try:
            user_addresses = UserAddress.objects.filter(user=obj.user)
            return UserAddressSerializer(user_addresses, many=True).data
        except Exception:
            return []
    
    def get_recent_orders(self, obj):
        """Получает список последних заказов пользователя"""
        try:
            # Импортируем здесь, чтобы избежать циклических импортов
            from orders.models import Order
            recent_orders = Order.objects.filter(user=obj.user).order_by('-created_at')[:5]
            
            # Используем OrderBriefSerializer для краткой информации о заказах
            return OrderBriefSerializer(recent_orders, many=True).data
        except Exception:
            return []
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Обновляем поля профиля
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        
        # Обновляем или создаем адрес (для обратной совместимости)
        if address_data:
            if instance.address:
                for attr, value in address_data.items():
                    setattr(instance.address, attr, value)
                instance.address.save()
            else:
                address = Address.objects.create(**address_data)
                instance.address = address
                
                # Также создаем запись в UserAddress, если такого адреса еще нет
                user_addresses = UserAddress.objects.filter(user=instance.user)
                if not user_addresses.filter(address__district=address.district, 
                                          address__street=address.street, 
                                          address__house_number=address.house_number).exists():
                    # Если у пользователя еще нет адресов, этот будет по умолчанию
                    is_default = not user_addresses.exists()
                    UserAddress.objects.create(
                        user=instance.user,
                        address=address,
                        is_default=is_default,
                        name="Основной адрес"
                    )
        
        instance.save()
        return instance
    