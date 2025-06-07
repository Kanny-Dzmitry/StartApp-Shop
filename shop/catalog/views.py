from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, DetailView
from .models import Category, Section, Product

# Create your views here.

class CategoryListView(ListView):
    """Представление для отображения списка категорий"""
    model = Category
    template_name = 'catalog/category_list.html'
    context_object_name = 'categories'
    
    def get_queryset(self):
        return Category.objects.filter(available=True)


class CategoryDetailView(DetailView):
    """Представление для отображения деталей категории и её разделов"""
    model = Category
    template_name = 'catalog/category_detail.html'
    context_object_name = 'category'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['sections'] = self.object.sections.filter(available=True)
        return context
    
    def get_object(self, queryset=None):
        if queryset is None:
            queryset = self.get_queryset()
        slug = self.kwargs.get(self.slug_url_kwarg)
        queryset = queryset.filter(slug=slug, available=True)
        try:
            return queryset.get()
        except queryset.model.DoesNotExist:
            from django.http import Http404
            raise Http404("Категория не найдена или недоступна")


class SectionDetailView(DetailView):
    """Представление для отображения деталей раздела и его товаров"""
    model = Section
    template_name = 'catalog/section_detail.html'
    context_object_name = 'section'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['products'] = self.object.products.filter(available=True)
        return context
    
    def get_object(self, queryset=None):
        category_slug = self.kwargs.get('category_slug')
        section_slug = self.kwargs.get('slug')
        
        category = get_object_or_404(Category, slug=category_slug, available=True)
        section = get_object_or_404(Section, slug=section_slug, category=category, available=True)
        
        return section


class ProductDetailView(DetailView):
    """Представление для отображения деталей товара"""
    model = Product
    template_name = 'catalog/product_detail.html'
    context_object_name = 'product'
    
    def get_object(self, queryset=None):
        category_slug = self.kwargs.get('category_slug')
        section_slug = self.kwargs.get('section_slug')
        product_slug = self.kwargs.get('slug')
        
        category = get_object_or_404(Category, slug=category_slug, available=True)
        section = get_object_or_404(Section, slug=section_slug, category=category, available=True)
        product = get_object_or_404(Product, slug=product_slug, section=section, available=True)
        
        return product
