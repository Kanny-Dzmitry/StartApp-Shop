from django.contrib import admin
from .models import Order, OrderItem, DeliverySettings

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'product_price', 'quantity', 'total_price')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'payment_method', 'total_price', 'delivery_cost', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('total_price',)
    inlines = [OrderItemInline]
    
    def get_readonly_fields(self, request, obj=None):
        if obj: # Если это существующий объект
            return self.readonly_fields + ('user', 'address')
        return self.readonly_fields

@admin.register(DeliverySettings)
class DeliverySettingsAdmin(admin.ModelAdmin):
    list_display = ('free_delivery_threshold', 'delivery_cost', 'is_active')
    list_editable = ('is_active',)
    actions = ['activate_settings', 'deactivate_settings']
    
    def activate_settings(self, request, queryset):
        """Активировать выбранные настройки доставки"""
        # Сначала деактивируем все настройки
        DeliverySettings.objects.all().update(is_active=False)
        # Затем активируем выбранные
        queryset.update(is_active=True)
        self.message_user(request, f"Активированы выбранные настройки доставки ({queryset.count()})")
    activate_settings.short_description = "Активировать выбранные настройки"
    
    def deactivate_settings(self, request, queryset):
        """Деактивировать выбранные настройки доставки"""
        queryset.update(is_active=False)
        self.message_user(request, f"Деактивированы выбранные настройки доставки ({queryset.count()})")
    deactivate_settings.short_description = "Деактивировать выбранные настройки"
