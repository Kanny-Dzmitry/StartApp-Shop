from django import forms
from .models import Category, Section, Product
from PIL import Image
import os

class ImageValidationMixin:
    """Миксин для валидации изображений"""
    
    def clean_image(self):
        image = self.cleaned_data.get('image')
        if image:
            # Проверка расширения файла
            ext = os.path.splitext(image.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            if ext not in valid_extensions:
                raise forms.ValidationError('Поддерживаемые форматы изображений: JPG, JPEG, PNG, WEBP')
            
            # Проверка размера файла (не более 5 МБ)
            if image.size > 5 * 1024 * 1024:
                raise forms.ValidationError('Размер изображения не должен превышать 5 МБ')
                
        return image

class CategoryForm(forms.ModelForm, ImageValidationMixin):
    """Форма для модели категории"""
    
    class Meta:
        model = Category
        fields = ['name', 'slug', 'image']
        
class SectionForm(forms.ModelForm, ImageValidationMixin):
    """Форма для модели раздела"""
    
    class Meta:
        model = Section
        fields = ['category', 'name', 'slug', 'image']
        
class ProductForm(forms.ModelForm, ImageValidationMixin):
    """Форма для модели товара"""
    
    class Meta:
        model = Product
        fields = ['section', 'name', 'slug', 'image', 'description', 
                 'price', 'quantity_type', 'quantity_value', 'available'] 