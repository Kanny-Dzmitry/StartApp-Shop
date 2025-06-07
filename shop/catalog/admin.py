from django.contrib import admin
from django.utils.safestring import mark_safe
from .models import Category, Section, Product
from .forms import CategoryForm, SectionForm, ProductForm

# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    form = CategoryForm
    list_display = ['name', 'available', 'get_image', 'created_at', 'updated_at']
    list_filter = ['available', 'created_at', 'updated_at']
    list_editable = ['available']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    
    def get_image(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="50" height="50" style="object-fit: cover; border-radius: 8px;" />')
        return 'Нет изображения'
    
    get_image.short_description = 'Изображение'


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    form = SectionForm
    list_display = ['name', 'category', 'available', 'get_image', 'created_at', 'updated_at']
    list_filter = ['available', 'category', 'created_at', 'updated_at']
    list_editable = ['available']
    search_fields = ['name', 'category__name']
    prepopulated_fields = {'slug': ('name',)}
    
    def get_image(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="50" height="50" style="object-fit: cover; border-radius: 8px;" />')
        return 'Нет изображения'
    
    get_image.short_description = 'Изображение'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductForm
    list_display = ['name', 'section', 'price', 'quantity_value', 'quantity_type', 'available', 'get_image', 'created_at']
    list_filter = ['available', 'created_at', 'updated_at', 'section', 'section__category']
    list_editable = ['price', 'available']
    search_fields = ['name', 'description', 'section__name', 'section__category__name']
    prepopulated_fields = {'slug': ('name',)}
    
    def get_image(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="50" height="50" style="object-fit: cover; border-radius: 8px;" />')
        return 'Нет изображения'
    
    get_image.short_description = 'Изображение'
