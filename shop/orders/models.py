from django.db import models
from django.contrib.auth.models import User
from accounts.models import UserAddress
from catalog.models import Product
from decimal import Decimal

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