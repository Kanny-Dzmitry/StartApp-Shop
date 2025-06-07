from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['total_price']

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_id', 'total_items', 'total_price', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['total_price', 'total_items']
    inlines = [CartItemInline]
    search_fields = ['user__username', 'session_id']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart', 'product', 'quantity', 'total_price', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['total_price']
    search_fields = ['cart__user__username', 'cart__session_id', 'product__name']
