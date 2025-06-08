"""
Модуль с клавиатурами для основного меню бота.
"""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from app.locales.translations import get_text
from app.config import SHOP_URL

def get_main_keyboard(language: str) -> InlineKeyboardMarkup:
    """
    Создает основную инлайн-клавиатуру с кнопкой для открытия магазина.
    
    Args:
        language (str): Код языка пользователя
        
    Returns:
        InlineKeyboardMarkup: Инлайн-клавиатура с кнопкой
    """
    # Получаем текст для кнопки на языке пользователя
    shop_button_text = get_text('shop_button', language)
    
    # Создаем кнопку для открытия магазина как WebApp
    shop_button = InlineKeyboardButton(
        text=shop_button_text, 
        web_app=WebAppInfo(url=SHOP_URL)
    )
    
    # Создаем клавиатуру с кнопкой
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[shop_button]])
    
    return keyboard 