from django.shortcuts import render
from .models import NewsSlider

def home_view(request):
    """Представление для главной страницы."""
    active_slider = NewsSlider.objects.filter(is_active=True).first()
    
    # Получаем только видимые слайды, если есть активный слайдер
    slides = []
    if active_slider:
        slides = active_slider.slides.filter(is_visible=True).order_by('order')
    
    context = {
        'active_slider': active_slider,
        'slides': slides,
    }
    
    return render(request, 'telegram_app.html', context)
