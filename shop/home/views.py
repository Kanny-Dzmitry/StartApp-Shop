from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import NewsSlider, RatingPoll, UserRating, ShopInfo

def home_view(request):
    """Представление для главной страницы."""
    active_slider = NewsSlider.objects.filter(is_active=True).first()
    
    # Получаем только видимые слайды, если есть активный слайдер
    slides = []
    if active_slider:
        slides = active_slider.slides.filter(is_visible=True).order_by('order')
    
    # Получаем активный опрос для оценки
    active_poll = RatingPoll.objects.filter(is_active=True).first()
    
    # Проверяем, голосовал ли уже пользователь
    user_has_voted = False
    user_id = request.GET.get('user_id')
    
    if active_poll and user_id:
        user_has_voted = UserRating.objects.filter(poll=active_poll, user_id=user_id).exists()
    
    # Получаем информацию о магазине
    shop_info = ShopInfo.objects.first()
    
    context = {
        'active_slider': active_slider,
        'slides': slides,
        'active_poll': active_poll,
        'user_has_voted': user_has_voted,
        'shop_info': shop_info,
    }
    
    return render(request, 'telegram_app.html', context)

@csrf_exempt
def submit_rating(request):
    """Обработчик для приема оценок от пользователей."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Метод не поддерживается'})
    
    try:
        data = json.loads(request.body)
        poll_id = data.get('poll_id')
        user_id = data.get('user_id')
        user_name = data.get('user_name')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        # Проверяем обязательные поля
        if not all([poll_id, user_id, rating]):
            return JsonResponse({'success': False, 'error': 'Отсутствуют обязательные поля'})
        
        # Проверяем существование опроса
        try:
            poll = RatingPoll.objects.get(id=poll_id, is_active=True)
        except RatingPoll.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Опрос не найден'})
        
        # Проверяем, не голосовал ли пользователь уже
        if UserRating.objects.filter(poll=poll, user_id=user_id).exists():
            return JsonResponse({'success': False, 'error': 'Вы уже голосовали в этом опросе'})
        
        # Создаем новую оценку
        UserRating.objects.create(
            poll=poll,
            user_id=user_id,
            user_name=user_name,
            rating=rating,
            comment=comment
        )
        
        return JsonResponse({
            'success': True, 
            'message': 'Спасибо за вашу оценку!',
            'average_rating': poll.get_average_rating(),
            'ratings_count': poll.get_ratings_count()
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
