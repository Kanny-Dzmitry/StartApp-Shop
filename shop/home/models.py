from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class NewsSlider(models.Model):
    """Модель для группы слайдов новостей/акций на главной странице."""
    title = models.CharField(_('Название'), max_length=100)
    is_active = models.BooleanField(_('Активен'), default=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)

    class Meta:
        verbose_name = _('Слайдер новостей')
        verbose_name_plural = _('Слайдеры новостей')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class NewsSlide(models.Model):
    """Модель для отдельного слайда в слайдере новостей/акций."""
    slider = models.ForeignKey(NewsSlider, on_delete=models.CASCADE, related_name='slides', verbose_name=_('Слайдер'))
    image = models.ImageField(_('Изображение'), upload_to='news_slides/')
    link = models.URLField(_('Ссылка'), blank=True, null=True)
    is_visible = models.BooleanField(_('Отображается'), default=True)
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)

    class Meta:
        verbose_name = _('Слайд')
        verbose_name_plural = _('Слайды')
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Слайд #{self.id}"

class RatingPoll(models.Model):
    """Модель для опросов с оценкой от 1 до 5 звезд."""
    title = models.CharField(_('Название'), max_length=100)
    description = models.TextField(_('Описание'), help_text=_('Опишите, что пользователи должны оценить'), blank=True)
    is_active = models.BooleanField(_('Активен'), default=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('Опрос с оценкой')
        verbose_name_plural = _('Опросы с оценкой')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_average_rating(self):
        """Получить среднюю оценку для этого опроса."""
        ratings = self.ratings.all()
        if not ratings:
            return 0
        return sum(rating.rating for rating in ratings) / ratings.count()
    
    def get_ratings_count(self):
        """Получить количество оценок для этого опроса."""
        return self.ratings.count()

class UserRating(models.Model):
    """Модель для хранения оценок пользователей."""
    poll = models.ForeignKey(RatingPoll, on_delete=models.CASCADE, related_name='ratings', verbose_name=_('Опрос'))
    user_id = models.CharField(_('ID пользователя Telegram'), max_length=100)
    user_name = models.CharField(_('Имя пользователя'), max_length=255, blank=True, null=True)
    rating = models.PositiveSmallIntegerField(
        _('Оценка'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_('Оценка от 1 до 5 звезд')
    )
    comment = models.TextField(_('Комментарий'), blank=True, null=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Оценка пользователя')
        verbose_name_plural = _('Оценки пользователей')
        ordering = ['-created_at']
        # Один пользователь может оставить только одну оценку для каждого опроса
        unique_together = ['poll', 'user_id']
    
    def __str__(self):
        return f"{self.user_name or self.user_id} - {self.rating} звезд"

class ShopInfo(models.Model):
    """Модель для хранения информации о магазине."""
    title = models.CharField(_('Название магазина'), max_length=100)
    logo = models.ImageField(_('Логотип'), upload_to='shop_info/', blank=True, null=True)
    description = models.TextField(_('Описание магазина'), help_text=_('Краткое описание магазина (до 200 символов)'), max_length=200)
    address = models.TextField(_('Адрес'), blank=True, max_length=150)
    phone = models.CharField(_('Телефон'), max_length=100, blank=True)
    email = models.EmailField(_('Email'), blank=True)
    working_hours = models.TextField(_('Часы работы'), blank=True, max_length=100)
    
    # Социальные сети
    telegram = models.CharField(_('Telegram'), max_length=100, blank=True, help_text=_('Имя пользователя без @'))
    whatsapp = models.CharField(_('WhatsApp'), max_length=100, blank=True, help_text=_('Номер телефона в международном формате'))
    instagram = models.CharField(_('Instagram'), max_length=100, blank=True, help_text=_('Имя пользователя без @'))
    vk = models.CharField(_('VK'), max_length=100, blank=True, help_text=_('ID или короткое имя'))
    
    # Дополнительные поля
    show_on_home = models.BooleanField(_('Показывать на главной'), default=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('Информация о магазине')
        verbose_name_plural = _('Информация о магазине')
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Переопределяем метод save, чтобы гарантировать, что будет только одна запись."""
        if not self.pk and ShopInfo.objects.exists():
            # Если это новая запись и уже есть существующая, вызываем исключение
            raise ValidationError('Может быть только одна запись с информацией о магазине')
        return super().save(*args, **kwargs)
