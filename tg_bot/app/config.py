import os
from pathlib import Path
from dotenv import load_dotenv

# Получение абсолютного пути к директории проекта
BASE_DIR = Path(__file__).resolve().parent.parent

# Загрузка переменных окружения из файла .env
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Токен бота
BOT_TOKEN = os.getenv('BOT_TOKEN')

# Поддерживаемые языки
SUPPORTED_LANGUAGES = ['ru', 'en']
DEFAULT_LANGUAGE = 'ru'

# URL магазина для WebApp
SHOP_URL = 'https://bbcd-109-172-54-217.ngrok-free.app' # Замените на реальный URL вашего магазина 