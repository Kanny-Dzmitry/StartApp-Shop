"""
Обработчик команды /start.
"""

from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from app.keyboards.main_keyboard import get_main_keyboard
from app.locales.translations import get_text

# Создаем роутер для команды /start
router = Router()

@router.message(Command("start"))
async def cmd_start(message: Message, user_language: str = 'ru'):
    """
    Обработчик команды /start.
    Отправляет приветственное сообщение с кнопкой для открытия магазина.
    
    Args:
        message (Message): Сообщение пользователя
        user_language (str): Язык пользователя (добавляется middleware)
    """
    # Получаем текст приветствия на языке пользователя
    welcome_text = get_text('welcome_message', user_language)
    
    # Получаем клавиатуру с кнопкой для открытия магазина
    keyboard = get_main_keyboard(user_language)
    
    # Отправляем приветственное сообщение с клавиатурой
    await message.answer(
        text=welcome_text,
        reply_markup=keyboard
    ) 