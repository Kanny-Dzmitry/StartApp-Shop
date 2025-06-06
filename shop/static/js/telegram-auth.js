// Telegram Mini App API integration
let tg = window.Telegram.WebApp;

// Initialize Telegram Mini App
function initTelegramApp() {
    // Expand to full height
    tg.expand();
    
    // Get user data
    const user = tg.initDataUnsafe.user;
    
    // If user data exists, register or login the user
    if (user) {
        registerTelegramUser(user);
    } else {
        showError("Не удалось получить данные пользователя Telegram");
    }
    
    // Set theme based on Telegram's color scheme
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
}

// Register or login a Telegram user
function registerTelegramUser(user) {
    // Get the hash for validation
    const initData = tg.initData;
    
    // Prepare user data
    const userData = {
        username: `tg_${user.id}`,
        password: generateRandomPassword(), // Generate a random password for the user
        password2: generateRandomPassword(), // Same password for confirmation
        email: `${user.id}@telegram.user`, // Placeholder email
        telegram_id: user.id,
        telegram_username: user.username,
        telegram_first_name: user.first_name,
        telegram_last_name: user.last_name,
        telegram_photo_url: user.photo_url,
        telegram_auth_date: tg.initDataUnsafe.auth_date,
        telegram_hash: tg.initDataUnsafe.hash,
        init_data: initData
    };
    
    // Send registration request
    fetch('/api/accounts/telegram-auth/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при регистрации через Telegram');
        }
        return response.json();
    })
    .then(data => {
        // Store the token in localStorage
        localStorage.setItem('authToken', data.token);
        
        // Update profile info
        updateProfileInfo();
        
        // Show success message
        showMessage("Вы успешно авторизованы!");
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось авторизоваться. Пожалуйста, попробуйте еще раз.");
    });
}

// Generate a random password for the user
function generateRandomPassword() {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Show success message
function showMessage(message) {
    const messageElement = document.getElementById('success-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Mini App
    initTelegramApp();
}); 