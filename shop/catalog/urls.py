from django.urls import path
from . import views

app_name = 'catalog'

urlpatterns = [
    path('', views.CategoryListView.as_view(), name='category_list'),
    path('<slug:slug>/', views.CategoryDetailView.as_view(), name='category_detail'),
    path('<slug:category_slug>/<slug:slug>/', views.SectionDetailView.as_view(), name='section_detail'),
    path('<slug:category_slug>/<slug:section_slug>/<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
] 