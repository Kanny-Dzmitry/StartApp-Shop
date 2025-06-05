from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'district', 'street', 'house_number', 'floor', 'apartment', 'full_address']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id']
        
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    address = AddressSerializer(required=False)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'first_name', 'last_name', 'phone_number', 'address']
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        #Обнволяем поля профиля
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        
        # Обновляем или создаем адрес
        if address_data:
            if instance.address:
                for attr, value in address_data.items():
                    setattr(instance.address, attr, value)
                instance.address.save()
            else:
                address = Address.objects.create(**address_data)
                instance.address = address
        instance.save()
        return instance
    