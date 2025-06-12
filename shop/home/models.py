from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

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
    title = models.CharField(_('Заголовок'), max_length=100, blank=True, null=True)
    description = models.TextField(_('Описание'), blank=True, null=True)
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
        return self.title or f"Слайд #{self.id}"
