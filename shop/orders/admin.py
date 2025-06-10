from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'product_price', 'quantity', 'total_price')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'payment_method', 'total_price', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('total_price',)
    inlines = [OrderItemInline]
    
    def get_readonly_fields(self, request, obj=None):
        if obj: # Если это существующий объект
            return self.readonly_fields + ('user', 'address')
        return self.readonly_fields
