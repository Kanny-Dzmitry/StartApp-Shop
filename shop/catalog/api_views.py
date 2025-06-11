from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Category, Section, Product
from .serializers import (
    CategorySerializer, CategoryListSerializer,
    SectionSerializer, SectionListSerializer,
    ProductSerializer
)


class CategoryListAPIView(generics.ListAPIView):
    """API для получения списка всех категорий"""
    queryset = Category.objects.filter(available=True)
    serializer_class = CategoryListSerializer
    permission_classes = [permissions.AllowAny]


class CategoryDetailAPIView(generics.RetrieveAPIView):
    """API для получения детальной информации о категории"""
    queryset = Category.objects.filter(available=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class SectionListAPIView(generics.ListAPIView):
    """API для получения списка разделов категории"""
    serializer_class = SectionListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        category_slug = self.kwargs.get('category_slug')
        return Section.objects.filter(category__slug=category_slug, category__available=True, available=True)


class SectionDetailAPIView(generics.RetrieveAPIView):
    """API для получения детальной информации о разделе"""
    serializer_class = SectionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        category_slug = self.kwargs.get('category_slug')
        section_slug = self.kwargs.get('slug')
        return get_object_or_404(Section, slug=section_slug, category__slug=category_slug, 
                                category__available=True, available=True)


class ProductListAPIView(generics.ListAPIView):
    """API для получения списка товаров раздела"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        category_slug = self.kwargs.get('category_slug')
        section_slug = self.kwargs.get('section_slug')
        return Product.objects.filter(
            section__slug=section_slug, 
            section__category__slug=category_slug,
            section__available=True,
            section__category__available=True,
            available=True
        )


class ProductDetailAPIView(generics.RetrieveAPIView):
    """API для получения детальной информации о товаре"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        category_slug = self.kwargs.get('category_slug')
        section_slug = self.kwargs.get('section_slug')
        product_slug = self.kwargs.get('slug')
        return get_object_or_404(
            Product, 
            slug=product_slug, 
            section__slug=section_slug, 
            section__category__slug=category_slug,
            section__available=True,
            section__category__available=True,
            available=True
        )


class ProductSearchAPIView(generics.ListAPIView):
    """API для поиска товаров по названию с автодополнением"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return Product.objects.none()
        
        # Нормализуем запрос (приводим к нижнему регистру)
        query_lower = query.lower()
        
        # Поиск товаров по названию (нечувствительно к регистру)
        # Используем Q-объекты для комбинации условий
        return Product.objects.filter(
            Q(name__icontains=query) |  # Стандартный поиск без учета регистра
            Q(name__contains=query) |   # На случай, если icontains не работает с кириллицей
            Q(name__icontains=query_lower) |  # Поиск по нормализованному запросу
            Q(description__icontains=query),  # Также ищем в описании
            available=True,
            section__available=True,
            section__category__available=True
        ).distinct().order_by('name')[:10]  # Используем distinct() для удаления дубликатов 