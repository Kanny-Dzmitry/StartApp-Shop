from django.contrib import admin
from django.utils.html import format_html
from .models import NewsSlider, NewsSlide

class NewsSlideInline(admin.StackedInline):
    model = NewsSlide
    extra = 1
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fields = [
        ('title', 'is_visible'),
        'description',
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
    list_display = ['title', 'slider', 'is_visible', 'order', 'image_preview_small']
    list_filter = ['slider', 'is_visible']
    search_fields = ['title', 'description']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    list_editable = ['is_visible', 'order']
    
    fieldsets = [
        (None, {
            'fields': [
                'slider',
                'title',
                'description',
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
