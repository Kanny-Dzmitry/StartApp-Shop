from django.urls import path
from . import api_views

app_name = 'catalog_api'

urlpatterns = [
    # API для категорий
    path('categories/', api_views.CategoryListAPIView.as_view(), name='category_list'),
    path('categories/<slug:slug>/', api_views.CategoryDetailAPIView.as_view(), name='category_detail'),
    
    # API для разделов
    path('categories/<slug:category_slug>/sections/', api_views.SectionListAPIView.as_view(), name='section_list'),
    path('categories/<slug:category_slug>/sections/<slug:slug>/', api_views.SectionDetailAPIView.as_view(), name='section_detail'),
    
    # API для товаров
    path('categories/<slug:category_slug>/sections/<slug:section_slug>/products/', 
         api_views.ProductListAPIView.as_view(), name='product_list'),
    path('categories/<slug:category_slug>/sections/<slug:section_slug>/products/<slug:slug>/', 
         api_views.ProductDetailAPIView.as_view(), name='product_detail'),
         
    # API для поиска товаров
    path('search/products/', api_views.ProductSearchAPIView.as_view(), name='product_search'),
] 