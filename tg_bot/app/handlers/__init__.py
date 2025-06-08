# Initialize handlers package

from aiogram import Router
from app.handlers.start import router as start_router

# Создаем общий роутер для всех обработчиков
main_router = Router()

# Регистрируем все роутеры
main_router.include_router(start_router) 