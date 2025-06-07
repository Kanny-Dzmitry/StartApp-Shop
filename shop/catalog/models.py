from django.db import models
from django.urls import reverse
from PIL import Image
import os

# Create your models here.

class Category(models.Model):
    """Модель для категорий товаров"""
    name = models.CharField(max_length=100, verbose_name='Название категории')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='URL')
    image = models.ImageField(upload_to='categories/', blank=True, null=True, verbose_name='Изображение')
    available = models.BooleanField(default=True, verbose_name='Доступен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('category_detail', kwargs={'slug': self.slug})
    
    def save(self, *args, **kwargs):
        """Изменение размера изображения при сохранении и обрезка до квадрата"""
        super().save(*args, **kwargs)
        
        if self.image:
            img = Image.open(self.image.path)
            
            # Обрезаем изображение до квадрата
            width, height = img.size
            
            # Определяем размер для обрезки (берем минимальную сторону)
            size = min(width, height)
            
            # Вычисляем координаты для обрезки из центра
            left = (width - size) / 2
            top = (height - size) / 2
            right = (width + size) / 2
            bottom = (height + size) / 2
            
            # Обрезаем изображение
            img = img.crop((left, top, right, bottom))
            
            # Масштабируем до нужного размера
            output_size = (300, 300)
            img.thumbnail(output_size)
            
            # Сохраняем изображение
            img.save(self.image.path)


class Section(models.Model):
    """Модель для разделов категорий"""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='sections', verbose_name='Категория')
    name = models.CharField(max_length=100, verbose_name='Название раздела')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='URL')
    image = models.ImageField(upload_to='sections/', blank=True, null=True, verbose_name='Изображение')
    available = models.BooleanField(default=True, verbose_name='Доступен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Раздел'
        verbose_name_plural = 'Разделы'
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('section_detail', kwargs={'category_slug': self.category.slug, 'slug': self.slug})
    
    def save(self, *args, **kwargs):
        """Изменение размера изображения при сохранении и обрезка до квадрата"""
        super().save(*args, **kwargs)
        
        if self.image:
            img = Image.open(self.image.path)
            
            # Обрезаем изображение до квадрата
            width, height = img.size
            
            # Определяем размер для обрезки (берем минимальную сторону)
            size = min(width, height)
            
            # Вычисляем координаты для обрезки из центра
            left = (width - size) / 2
            top = (height - size) / 2
            right = (width + size) / 2
            bottom = (height + size) / 2
            
            # Обрезаем изображение
            img = img.crop((left, top, right, bottom))
            
            # Масштабируем до нужного размера
            output_size = (300, 300)
            img.thumbnail(output_size)
            
            # Сохраняем изображение
            img.save(self.image.path)


class Product(models.Model):
    """Модель для товаров"""
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='products', verbose_name='Раздел')
    name = models.CharField(max_length=200, verbose_name='Название товара')
    slug = models.SlugField(max_length=200, unique=True, verbose_name='URL')
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name='Изображение')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    quantity_type = models.CharField(max_length=20, verbose_name='Единица измерения', 
                                   help_text='Например: кг, гр, л, мл и т.д.')
    quantity_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Значение количества')
    available = models.BooleanField(default=True, verbose_name='Доступен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('product_detail', kwargs={'category_slug': self.section.category.slug, 
                                               'section_slug': self.section.slug, 
                                               'slug': self.slug})
    
    def save(self, *args, **kwargs):
        """Изменение размера изображения при сохранении"""
        super().save(*args, **kwargs)
        
        if self.image:
            img = Image.open(self.image.path)
            if img.height > 500 or img.width > 500:
                output_size = (500, 500)
                img.thumbnail(output_size)
                img.save(self.image.path)
