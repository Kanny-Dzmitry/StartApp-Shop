// Общие утилиты для приложения

// Показать индикатор загрузки
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Проверяем, есть ли уже индикатор загрузки
    if (container.querySelector('.loading-indicator')) return;
    
    // Создаем индикатор загрузки
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Загрузка...</p>
    `;
    
    // Добавляем индикатор в контейнер
    container.appendChild(loadingIndicator);
}

// Скрыть индикатор загрузки
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Находим и удаляем индикатор загрузки
    const loadingIndicator = container.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Показать сообщение об ошибке
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) return;
    
    // Устанавливаем текст ошибки
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Показать сообщение об успехе
function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    if (!successMessage) return;
    
    // Устанавливаем текст сообщения
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (!window.Telegram || !window.Telegram.WebApp) return;
    
    // Получаем цвета темы из Telegram WebApp
    const colorScheme = window.Telegram.WebApp.colorScheme;
    document.documentElement.classList.toggle('theme-dark', colorScheme === 'dark');
    
    // Устанавливаем цвет фона и текста
    document.body.style.backgroundColor = window.Telegram.WebApp.backgroundColor;
    document.body.style.color = window.Telegram.WebApp.textColor;
    
    // Устанавливаем цвет кнопки "Назад"
    if (window.Telegram.WebApp.BackButton) {
        window.Telegram.WebApp.BackButton.onClick(() => {
            window.history.back();
        });
    }
    
    // Устанавливаем цвет заголовка
    if (window.Telegram.WebApp.headerColor) {
        document.querySelector('.header')?.style.backgroundColor = window.Telegram.WebApp.headerColor;
    }
} 