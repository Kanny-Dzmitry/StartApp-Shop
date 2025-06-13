from django.contrib import admin
from django.utils.html import format_html
from .models import NewsSlider, NewsSlide, RatingPoll, UserRating, ShopInfo
from django.db.models import Q

class NewsSlideInline(admin.StackedInline):
    model = NewsSlide
    extra = 1
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fields = [
        ('is_visible'),
        ('image', 'image_preview'),
        'link',
        ('order'),
        ('created_at', 'updated_at')
    ]
    classes = ['collapse', 'open']
    show_change_link = True
    
    def image_preview(self, obj):
        if obj and obj.image and hasattr(obj.image, 'url'):
            return format_html(
                '<div class="image-preview-container">'
                '<img src="{}" style="max-height: 200px; max-width: 100%;" />'
                '</div>',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Нет изображения</span>')
    
    image_preview.short_description = 'Предпросмотр'

@admin.register(NewsSlider)
class NewsSliderAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'created_at', 'slide_count']
    list_filter = ['is_active']
    search_fields = ['title']
    inlines = [NewsSlideInline]
    save_on_top = True
    
    fieldsets = [
        (None, {
            'fields': [('title', 'is_active'), 'created_at']
        }),
    ]
    
    readonly_fields = ['created_at']
    
    def slide_count(self, obj):
        return obj.slides.count()
    
    slide_count.short_description = 'Количество слайдов'
    
    def get_inline_instances(self, request, obj=None):
        if obj:
            NewsSlideInline.verbose_name_plural = f'Слайды для "{obj.title}"'
        return super().get_inline_instances(request, obj)
    
    class Media:
        css = {
            'all': ('css/admin-custom.css',)
        }
        js = ('js/admin-custom.js',)

@admin.register(NewsSlide)
class NewsSlideAdmin(admin.ModelAdmin):
    list_display = ['slider', 'is_visible', 'order', 'image_preview_small']
    list_filter = ['slider', 'is_visible']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    list_editable = ['is_visible', 'order']
    
    fieldsets = [
        (None, {
            'fields': [
                'slider',
                ('image', 'image_preview'),
                'link',
                ('is_visible', 'order'),
                ('created_at', 'updated_at')
            ]
        }),
    ]
    
    def image_preview(self, obj):
        if obj and obj.image and hasattr(obj.image, 'url'):
            return format_html(
                '<div class="image-preview-container">'
                '<img src="{}" style="max-height: 300px; max-width: 100%;" />'
                '</div>',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Нет изображения</span>')
    
    def image_preview_small(self, obj):
        if obj and obj.image and hasattr(obj.image, 'url'):
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 100px;" />',
                obj.image.url
            )
        return format_html('<span style="color: #999;">Нет</span>')
    
    image_preview.short_description = 'Предпросмотр'
    image_preview_small.short_description = 'Изображение'

class UserRatingInline(admin.TabularInline):
    model = UserRating
    extra = 0
    readonly_fields = ['user_id', 'user_name', 'rating', 'rating_stars', 'comment', 'created_at']
    fields = ['user_id', 'user_name', 'rating_stars', 'comment', 'created_at']
    can_delete = False
    ordering = ['-created_at']
    max_num = 0  # Запрещаем добавление новых оценок через инлайн
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<div style="color: #FFD700;">{}</div>', stars)
    
    rating_stars.short_description = 'Оценка'

class RatingListFilter(admin.SimpleListFilter):
    title = 'Оценка'
    parameter_name = 'rating'
    
    def lookups(self, request, model_admin):
        return [
            ('5', '★★★★★ (5)'),
            ('4', '★★★★☆ (4)'),
            ('3', '★★★☆☆ (3)'),
            ('2', '★★☆☆☆ (2)'),
            ('1', '★☆☆☆☆ (1)'),
        ]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(rating=self.value())
        return queryset

class HasCommentFilter(admin.SimpleListFilter):
    title = 'Наличие комментария'
    parameter_name = 'has_comment'
    
    def lookups(self, request, model_admin):
        return [
            ('yes', 'Есть комментарий'),
            ('no', 'Без комментария'),
        ]
    
    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.exclude(comment__isnull=True).exclude(comment__exact='')
        if self.value() == 'no':
            return queryset.filter(Q(comment__isnull=True) | Q(comment__exact=''))
        return queryset

@admin.register(RatingPoll)
class RatingPollAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'created_at', 'get_average_rating_display', 'get_ratings_count_display', 'comments_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'get_average_rating_display', 'get_ratings_count_display', 'get_ratings_distribution', 'comments_count']
    inlines = [UserRatingInline]
    actions = ['activate_polls', 'deactivate_polls', 'export_ratings_csv']
    save_on_top = True
    
    fieldsets = [
        (None, {
            'fields': [
                'title', 
                'description',
                'is_active',
            ]
        }),
        ('Статистика', {
            'fields': [
                ('get_average_rating_display', 'get_ratings_count_display'),
                'get_ratings_distribution',
                'comments_count',
                ('created_at', 'updated_at')
            ],
            'classes': ['collapse', 'open'],
        }),
    ]
    
    def get_average_rating_display(self, obj):
        avg_rating = obj.get_average_rating()
        stars = '★' * int(avg_rating) + '☆' * (5 - int(avg_rating))
        return format_html(
            '<div style="font-size: 1.2em; color: #FFD700;">{}</div>'
            '<div>{} из 5</div>',
            stars, round(avg_rating, 2)
        )
    
    get_average_rating_display.short_description = 'Средняя оценка'
    
    def get_ratings_count_display(self, obj):
        count = obj.get_ratings_count()
        return format_html('<strong>{}</strong> {}'.format(
            count, 
            'голос' if count % 10 == 1 and count % 100 != 11 else 
            'голоса' if 2 <= count % 10 <= 4 and (count % 100 < 10 or count % 100 >= 20) else 
            'голосов'
        ))
    
    get_ratings_count_display.short_description = 'Количество оценок'
    
    def comments_count(self, obj):
        comments = obj.ratings.exclude(comment__isnull=True).exclude(comment__exact='').count()
        total = obj.ratings.count()
        
        if total == 0:
            return '0'
        
        percentage = (comments / total) * 100 if total > 0 else 0
        return format_html('{} ({}%)', comments, round(percentage, 1))
    
    comments_count.short_description = 'Комментарии'
    
    def get_ratings_distribution(self, obj):
        # Получаем распределение оценок
        distribution = {}
        for i in range(1, 6):
            distribution[i] = 0
            
        ratings = obj.ratings.all()
        for rating in ratings:
            distribution[rating.rating] = distribution.get(rating.rating, 0) + 1
        
        total = len(ratings)
        if total == 0:
            return format_html('<span style="color: #999;">Нет оценок</span>')
        
        # Создаем HTML для отображения распределения
        html = '<div style="margin-bottom: 10px;">Распределение оценок:</div><table style="width: 100%;">'
        
        for i in range(5, 0, -1):
            count = distribution[i]
            percentage = (count / total) * 100 if total > 0 else 0
            stars = '★' * i + '☆' * (5 - i)
            
            html += format_html(
                '<tr>'
                '<td style="width: 80px;"><div style="color: #FFD700;">{}</div></td>'
                '<td style="width: 50px; text-align: center;">{}</td>'
                '<td><div style="background-color: #f0f0f0; height: 14px; border-radius: 7px; overflow: hidden;">'
                '<div style="background-color: #FFD700; width: {}%; height: 100%;"></div>'
                '</div></td>'
                '<td style="width: 60px; text-align: right;">{:.1f}%</td>'
                '</tr>',
                stars, count, percentage, percentage
            )
        
        html += '</table>'
        return format_html(html)
    
    get_ratings_distribution.short_description = 'Распределение оценок'
    
    def activate_polls(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"Активировано {queryset.count()} опросов")
    
    activate_polls.short_description = "Активировать выбранные опросы"
    
    def deactivate_polls(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"Деактивировано {queryset.count()} опросов")
    
    deactivate_polls.short_description = "Деактивировать выбранные опросы"
    
    def export_ratings_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from datetime import datetime
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ratings_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Опрос', 'ID пользователя', 'Имя пользователя', 'Оценка', 'Комментарий', 'Дата'])
        
        for poll in queryset:
            ratings = poll.ratings.all()
            for rating in ratings:
                writer.writerow([
                    poll.title,
                    rating.user_id,
                    rating.user_name or '',
                    rating.rating,
                    rating.comment or '',
                    rating.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        return response
    
    export_ratings_csv.short_description = "Экспорт оценок в CSV"

@admin.register(UserRating)
class UserRatingAdmin(admin.ModelAdmin):
    list_display = ['user_name_display', 'poll', 'rating_stars', 'comment_preview', 'created_at']
    list_filter = ['poll', RatingListFilter, HasCommentFilter, 'created_at']
    search_fields = ['user_name', 'user_id', 'comment']
    readonly_fields = ['created_at']
    list_select_related = ['poll']  # Оптимизация запросов
    list_per_page = 20  # Количество записей на странице
    date_hierarchy = 'created_at'  # Навигация по датам
    
    fieldsets = [
        (None, {
            'fields': [
                'poll',
                ('user_id', 'user_name'),
                'rating',
                'comment',
                'created_at'
            ]
        }),
    ]
    
    def user_name_display(self, obj):
        return obj.user_name or f"Пользователь {obj.user_id}"
    
    user_name_display.short_description = 'Пользователь'
    
    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<div style="color: #FFD700;">{}</div>', stars)
    
    rating_stars.short_description = 'Оценка'
    
    def comment_preview(self, obj):
        if not obj.comment:
            return format_html('<span style="color: #999;">Нет комментария</span>')
        
        # Ограничиваем длину комментария для отображения в списке
        max_length = 50
        comment = obj.comment
        if len(comment) > max_length:
            comment = comment[:max_length] + '...'
        
        return format_html('<div title="{}">{}</div>', obj.comment, comment)
    
    comment_preview.short_description = 'Комментарий'

@admin.register(ShopInfo)
class ShopInfoAdmin(admin.ModelAdmin):
    list_display = ['title', 'phone', 'email', 'show_on_home', 'updated_at']
    fieldsets = [
        (None, {
            'fields': [
                'title',
                ('logo', 'logo_preview'),
                'description',
            ],
            'description': 'Основная информация о магазине'
        }),
        ('Контактная информация', {
            'fields': [
                'address',
                'phone',
                'email',
                'working_hours',
            ],
            'description': 'Контактные данные для связи с магазином'
        }),
        ('Социальные сети', {
            'fields': [
                'telegram',
                'whatsapp',
                'instagram',
                'vk',
            ],
            'description': 'Ссылки на социальные сети (заполняйте без @ и http://)'
        }),
        ('Настройки отображения', {
            'fields': [
                'show_on_home',
            ],
            'description': 'Настройки отображения блока на главной странице'
        }),
        ('Служебная информация', {
            'fields': [
                ('created_at', 'updated_at'),
            ],
            'classes': ['collapse'],
        }),
    ]
    readonly_fields = ['created_at', 'updated_at', 'logo_preview']
    
    def logo_preview(self, obj):
        if obj and obj.logo and hasattr(obj.logo, 'url'):
            return format_html(
                '<div class="image-preview-container">'
                '<img src="{}" style="max-height: 100px; max-width: 100%;" />'
                '</div>',
                obj.logo.url
            )
        return format_html('<span style="color: #999;">Нет изображения</span>')
    
    logo_preview.short_description = 'Предпросмотр логотипа'
    
    def has_add_permission(self, request):
        # Разрешаем создание только если нет записей
        return not ShopInfo.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Запрещаем удаление
        return False
