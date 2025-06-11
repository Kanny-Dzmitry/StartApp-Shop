from django.db import models
from django.contrib.auth.models import User
from accounts.models import UserAddress
from catalog.models import Product
from decimal import Decimal

class DeliverySettings(models.Model):
    free_delivery_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=8000, 
        verbose_name='Порог бесплатной доставки'
    )
    delivery_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1000, 
        verbose_name='Стоимость доставки'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активно'
    )
    
    class Meta:
        verbose_name = 'Настройки доставки'
        verbose_name_plural = 'Настройки доставки'
    
    def __str__(self):
        status = "Активно" if self.is_active else "Неактивно"
        return f"Бесплатная доставка от {self.free_delivery_threshold} ₽, стоимость доставки: {self.delivery_cost} ₽ ({status})"
    
    @classmethod
    def get_settings(cls):
        """Получить активные настройки доставки или создать настройки по умолчанию"""
        settings = cls.objects.filter(is_active=True).first()
        if not settings:
            # Если нет активных настроек, создаем новые
            settings = cls.objects.create(is_active=True)
        return settings

class Order(models.Model):
    PAYMENT_METHODS = (
        ('cash', 'Наличными при получении'),
        ('card', 'Картой при получении'),
    )
    
    STATUS_CHOICES = (
        ('new', 'Новый'),
        ('processing', 'В обработке'),
        ('delivering', 'Доставляется'),
        ('completed', 'Выполнен'),
        ('canceled', 'Отменен'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(UserAddress, on_delete=models.SET_NULL, null=True, related_name='orders')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий к заказу')
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Стоимость доставки')
    
    def __str__(self):
        return f"Заказ #{self.id} от {self.user.username}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Сохраняем название на случай удаления продукта
    product_price = models.DecimalField(max_digits=10, decimal_places=2)  # Сохраняем цену на момент заказа
    quantity = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.product_name} ({self.quantity} шт.) в заказе #{self.order.id}"
    
    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'
    
    @property
    def total_price(self):
        # Проверка на None, чтобы избежать ошибки при умножении
        if self.product_price is None:
            return Decimal('0.00')
        try:
            return self.product_price * self.quantity
        except (TypeError, ValueError):
            return Decimal('0.00')