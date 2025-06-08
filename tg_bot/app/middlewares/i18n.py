"""
Middleware для обработки языка пользователя.
Получает язык из настроек пользователя в Telegram и сохраняет его в контексте.
"""

from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, User
from app.config import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES

class I18nMiddleware(BaseMiddleware):
    """Middleware для обработки языка пользователя"""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        # Получаем пользователя из данных события
        user = data.get('event_from_user')
        
        if user and isinstance(user, User):
            # Получаем код языка из настроек пользователя
            language_code = user.language_code

            # Проверяем поддерживается ли язык
            if language_code and language_code in SUPPORTED_LANGUAGES:
                user_language = language_code
            else:
                user_language = DEFAULT_LANGUAGE
        else:
            user_language = DEFAULT_LANGUAGE
        
        # Добавляем язык пользователя в параметры хэндлера
        data['user_language'] = user_language
        
        # Передаем обработку дальше
        return await handler(event, data) 