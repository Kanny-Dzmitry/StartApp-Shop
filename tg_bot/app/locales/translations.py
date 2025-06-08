"""
Модуль с переводами для бота.
Содержит словари с переводами на разные языки.
"""

TRANSLATIONS = {
    'ru': {
        'welcome_message': '🎉 Приветствуем тебя в нашем волшебном магазине! 🛍️ Загляни — здесь тебя ждёт что-то особенное! ✨',
        'shop_button': '🛒 Перейти в магазин',
        'language_changed': '🌐 Язык успешно изменён на русский!',
    },
    'en': {
        'welcome_message': '🎉 Hey there! Welcome to our magical shop! 🛍️ Dive in – something amazing is waiting for you! ✨',
        'shop_button': '🛒 Visit Shop',
        'language_changed': '🌐 Language switched to English!',
    }
}

def get_text(key, language):
    """
    Получить перевод по ключу и языку.
    
    Args:
        key (str): Ключ перевода
        language (str): Код языка (например, 'ru', 'en')
        
    Returns:
        str: Текст перевода или ключ, если перевод не найден
    """
    if language not in TRANSLATIONS:
        language = 'ru'  # Язык по умолчанию
    
    return TRANSLATIONS[language].get(key, key) 