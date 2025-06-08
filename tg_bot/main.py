"""
Главный файл бота.
Содержит инициализацию и запуск бота.
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from app.config import BOT_TOKEN
from app.handlers import main_router
from app.middlewares.i18n import I18nMiddleware

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Функция для запуска бота
async def main():
    # Инициализация хранилища состояний
    storage = MemoryStorage()
    
    # Инициализация бота и диспетчера
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=storage)
    
    # Регистрация middlewares
    dp.message.middleware(I18nMiddleware())
    dp.callback_query.middleware(I18nMiddleware())
    
    # Регистрация обработчиков
    dp.include_router(main_router)
    
    # Запуск бота
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == '__main__':
    # Запуск бота
    asyncio.run(main()) 