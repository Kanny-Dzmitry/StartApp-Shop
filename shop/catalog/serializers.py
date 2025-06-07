from rest_framework import serializers
from .models import Category, Section, Product


class ProductSerializer(serializers.ModelSerializer):
    """Сериализатор для товаров"""
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'image', 'description', 
            'price', 'quantity_type', 'quantity_value', 
            'available', 'created_at', 'updated_at'
        ]


class SectionSerializer(serializers.ModelSerializer):
    """Сериализатор для разделов"""
    products = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'slug', 'image', 'created_at', 'updated_at', 'products']


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий"""
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at', 'updated_at', 'sections']


class CategoryListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка категорий (без вложенных разделов)"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image']


class SectionListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка разделов (без вложенных товаров)"""
    class Meta:
        model = Section
        fields = ['id', 'name', 'slug', 'image', 'category'] 