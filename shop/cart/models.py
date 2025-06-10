from django.db import models
from django.contrib.auth.models import User
from catalog.models import Product
from decimal import Decimal

class Cart(models.Model):
    """Модель корзины покупок"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='carts', 
                            null=True, blank=True, verbose_name='Пользователь')
    session_id = models.CharField(max_length=255, null=True, blank=True, verbose_name='ID сессии')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-created_at']

    def __str__(self):
        return f"Cart {self.id} - {'User: ' + self.user.username if self.user else 'Session: ' + str(self.session_id)}"
    
    @property
    def total_price(self):
        """Расчет общей стоимости корзины"""
        # Используем Decimal(0) как начальное значение и добавляем проверку на None
        result = Decimal('0.00')
        for item in self.items.all():
            try:
                result += item.total_price
            except (TypeError, ValueError):
                # Пропускаем элементы с ошибками
                pass
        return result
    
    @property
    def total_items(self):
        """Общее количество товаров в корзине"""
        try:
            return sum(item.quantity for item in self.items.all())
        except (TypeError, ValueError):
            return 0


class CartItem(models.Model):
    """Модель элемента корзины"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name='Корзина')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='Товар')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Элемент корзины'
        verbose_name_plural = 'Элементы корзины'
        ordering = ['-created_at']
        unique_together = ['cart', 'product']  # Предотвращает дублирование товаров в корзине

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"
    
    @property
    def total_price(self):
        """Расчет общей стоимости товара с учетом количества"""
        if self.product is None or getattr(self.product, 'price', None) is None:
            return Decimal('0.00')
        return Decimal(self.product.price) * Decimal(self.quantity)
