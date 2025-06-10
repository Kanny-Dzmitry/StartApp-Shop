// Функции для работы с корзиной

// Глобальная переменная для хранения состояния корзины
let cart = null;

// Инициализация корзины
function initCart() {
    // Применяем тему Telegram
    applyTelegramTheme();
    
    // Всегда загружаем корзину при открытии вкладки
    loadCart();
}

// Определение и применение темы Telegram
function applyTelegramTheme() {
    if (window.Telegram && window.Telegram.WebApp) {
        const colorScheme = window.Telegram.WebApp.colorScheme;
        document.body.classList.add(`theme-${colorScheme}`);
        
        // Добавляем слушатель для изменения темы
        window.Telegram.WebApp.onEvent('themeChanged', () => {
            // Удаляем предыдущие классы тем
            document.body.classList.remove('theme-dark', 'theme-light');
            
            // Добавляем актуальный класс темы
            const newColorScheme = window.Telegram.WebApp.colorScheme;
            document.body.classList.add(`theme-${newColorScheme}`);
        });
    }
}

// Загрузка корзины
function loadCart() {
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    // Подготавливаем заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    return fetch('/api/cart/', {
        headers: headers
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении корзины');
            }
            return response.json();
        })
        .then(data => {
            cart = data;
            
            // Обновляем информацию о корзине в localStorage для устойчивости
            if (data && data.items) {
                // Диспетчеризуем событие обновления корзины
                dispatchCartUpdatedEvent();
            }
            
            renderCart();
            hideLoading('cart-container');
            
            // Обновляем отображение карточек товаров в каталоге
            if (document.querySelector('.product-card')) {
                updateProductCardsInCatalog();
                
                // Подсвечиваем товары в каталоге, если функция доступна
                if (typeof highlightProductsInCart === 'function') {
                    highlightProductsInCart();
                }
            }
            
            return data;
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось загрузить корзину');
            hideLoading('cart-container');
            return { items: [] };
        });
}

// Отрисовка корзины
function renderCart() {
    const cartContainer = document.getElementById('cart-container');
    
    // Очищаем контейнер
    cartContainer.innerHTML = '';
    
    // Добавляем заголовок
    const cartTitle = document.createElement('h2');
    cartTitle.className = 'cart-title';
    cartTitle.textContent = 'Корзина';
    cartContainer.appendChild(cartTitle);
    
    // Добавляем блок с кнопкой оформления заказа (сверху)
    const topCheckoutButton = document.createElement('div');
    topCheckoutButton.className = 'checkout-button';
    
    if (cart && cart.items.length > 0) {
        // Текст кнопки
        topCheckoutButton.innerHTML = `
            <div class="checkout-button-text">К оформлению</div>
            <div class="checkout-button-info">${cart.total_items} шт., ${cart.total_price} ₽</div>
        `;
        
        // Добавляем эффект свечения
        topCheckoutButton.style.animation = 'pulse 2s infinite';
        
        // Создаем стиль для анимации пульсации
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Добавляем обработчик события
        topCheckoutButton.addEventListener('click', proceedToCheckout);
    } else {
        // Если корзина пуста - неактивная кнопка
        topCheckoutButton.classList.add('disabled');
        topCheckoutButton.innerHTML = `
            <div class="checkout-button-text">К Оформлению</div>
            <div class="checkout-button-info">Корзина пуста</div>
        `;
    }
    
    cartContainer.appendChild(topCheckoutButton);
    
    // Создаем контейнер с прокруткой для элементов корзины
    const cartContent = document.createElement('div');
    cartContent.className = 'cart-content';
    
    if (!cart || cart.items.length === 0) {
        // Если корзина пуста
        const emptyCart = document.createElement('div');
        emptyCart.className = 'empty-cart';
        
        const emptyCartMessage = document.createElement('p');
        emptyCartMessage.textContent = 'Ваша корзина пуста';
        emptyCart.appendChild(emptyCartMessage);
        
        const catalogLink = document.createElement('button');
        catalogLink.className = 'btn';
        catalogLink.style.backgroundColor = 'var(--tg-theme-button-color, #3498db)';
        catalogLink.style.color = 'var(--tg-theme-button-text-color, white)';
        catalogLink.style.padding = '10px 20px';
        catalogLink.style.borderRadius = '5px';
        catalogLink.style.border = 'none';
        catalogLink.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.15)';
        catalogLink.textContent = 'Перейти в каталог';
        catalogLink.addEventListener('click', () => {
            // Переключаемся на вкладку каталога
            document.querySelector('.nav-button[data-tab="catalog"]').click();
        });
        emptyCart.appendChild(catalogLink);
        
        cartContent.appendChild(emptyCart);
    } else {
        // Создаем контейнер для товаров
        const cartItems = document.createElement('div');
        cartItems.className = 'cart-items';
        
        // Добавляем элементы корзины
        if (cart && cart.items && Array.isArray(cart.items)) {
            cart.items.forEach(item => {
                const cartItem = createCartItemElement(item);
                cartItems.appendChild(cartItem);
            });
        } else {
            console.error('cart.items не является массивом:', cart);
        }
        
        cartContent.appendChild(cartItems);
    }
    
    cartContainer.appendChild(cartContent);
}

// Создание элемента корзины
function createCartItemElement(item) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.setAttribute('data-id', item.id);
    
    // Изображение товара
    const itemImage = document.createElement('div');
    itemImage.className = 'cart-item-image';
    if (item.product.image) {
        itemImage.style.backgroundImage = `url(${item.product.image})`;
    } else {
        itemImage.classList.add('no-image');
        // Добавляем заглушку для товаров без изображения
        itemImage.innerHTML = '<div style="color: #aaa; font-size: 20px;">🖼️</div>';
    }
    cartItem.appendChild(itemImage);
    
    // Кнопка удаления товара из корзины
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-cart-item-btn';
    deleteBtn.innerHTML = '×'; // Символ крестика
    deleteBtn.title = 'Удалить товар';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCartItem(item.id);
    });
    cartItem.appendChild(deleteBtn);
    
    // Информация о товаре
    const itemInfo = document.createElement('div');
    itemInfo.className = 'cart-item-info';
    
    // Название товара
    const itemName = document.createElement('div');
    itemName.className = 'cart-item-name';
    itemName.textContent = item.product.name;
    itemInfo.appendChild(itemName);
    
    // Блок с ценой и количеством
    const priceQuantityBlock = document.createElement('div');
    priceQuantityBlock.className = 'product-price-quantity';
    
    // Цена товара
    const itemPrice = document.createElement('div');
    itemPrice.className = 'cart-item-price';
    itemPrice.textContent = `${item.product.price} ₽`;
    priceQuantityBlock.appendChild(itemPrice);
    
    // Единица измерения
    const itemUnit = document.createElement('div');
    itemUnit.className = 'cart-item-unit';
    itemUnit.textContent = `${item.product.quantity_value} ${item.product.quantity_type}`;
    priceQuantityBlock.appendChild(itemUnit);
    
    // Добавляем блок с ценой и количеством в информацию о товаре
    itemInfo.appendChild(priceQuantityBlock);
    
    // Общая стоимость товара
    const itemTotal = document.createElement('div');
    itemTotal.className = 'cart-item-total';
    itemTotal.textContent = `Итого: ${item.total_price} ₽`;
    itemInfo.appendChild(itemTotal);
    
    cartItem.appendChild(itemInfo);
    
    // Блок управления количеством
    const quantityControl = document.createElement('div');
    quantityControl.className = 'quantity-control';
    
    // Кнопка уменьшения количества
    const decreaseBtn = document.createElement('button');
    decreaseBtn.className = 'quantity-btn decrease-btn';
    decreaseBtn.textContent = '-';
    decreaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCartItemQuantity(item.id, item.quantity - 1);
    });
    quantityControl.appendChild(decreaseBtn);
    
    // Поле с количеством
    const quantity = document.createElement('span');
    quantity.className = 'quantity-value';
    quantity.textContent = item.quantity;
    quantityControl.appendChild(quantity);
    
    // Кнопка увеличения количества
    const increaseBtn = document.createElement('button');
    increaseBtn.className = 'quantity-btn increase-btn';
    increaseBtn.textContent = '+';
    increaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCartItemQuantity(item.id, item.quantity + 1);
    });
    quantityControl.appendChild(increaseBtn);
    
    cartItem.appendChild(quantityControl);
    
    return cartItem;
}

// Обновление количества товара в корзине
function updateCartItemQuantity(itemId, newQuantity) {
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Если количество равно 0, удаляем товар из корзины
    if (newQuantity <= 0) {
        return removeCartItem(itemId);
    }
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    // Подготавливаем заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    // Данные для запроса
    const data = {
        quantity: newQuantity
    };
    
    // Отправляем запрос на обновление количества
    return fetch(`/api/cart/update/${itemId}/`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при обновлении корзины');
        }
        return response.json();
    })
    .then(data => {
        console.log('Ответ от сервера при обновлении количества:', data);
        // Обновляем состояние корзины
        cart = data;
        
        // Обновляем отображение корзины
        renderCart();
        
        // Обновляем отображение карточек товаров в каталоге
        if (document.querySelector('.product-card')) {
            updateProductCardsInCatalog();
        }
        
        // Диспетчеризуем событие обновления корзины
        dispatchCartUpdatedEvent();
        
        // Скрываем индикатор загрузки
        hideLoading('cart-container');
        
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Не удалось обновить корзину');
        hideLoading('cart-container');
    });
}

// Обновление количества в интерфейсе без запроса к серверу
function updateQuantityInUI(itemId, newQuantity) {
    // Обновляем в корзине
    const cartItem = document.querySelector(`.cart-item[data-id="${itemId}"]`);
    if (cartItem) {
        const quantityValue = cartItem.querySelector('.quantity-value');
        if (quantityValue) {
            quantityValue.textContent = newQuantity;
        }
    }
    
    // Обновляем в каталоге
    if (cart && cart.items) {
        const item = cart.items.find(item => item.id === itemId);
        if (item) {
            const productId = item.product.id;
            const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (productCard) {
                const quantityValue = productCard.querySelector('.quantity-value');
                if (quantityValue) {
                    quantityValue.textContent = newQuantity;
                }
            }
        }
    }
}

// Удаление товара из корзины
function removeCartItem(itemId) {
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    // Подготавливаем заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    // Находим элемент товара для анимации
    const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
    
    // Анимируем удаление, если элемент найден
    if (itemElement) {
        itemElement.classList.add('removing');
    }
    
    // Отправляем запрос на удаление товара
    return fetch(`/api/cart/delete/${itemId}/`, {
        method: 'DELETE',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при удалении товара из корзины');
        }
        return response.json();
    })
    .then(data => {
        // Обновляем состояние корзины
        cart = data;
        
        // Обновляем отображение корзины
        renderCart();
        
        // Диспетчеризуем событие обновления корзины
        dispatchCartUpdatedEvent();
        
        // Обновляем отображение карточек товаров в каталоге
        if (document.querySelector('.product-card')) {
            updateProductCardsInCatalog();
        }
        
        // Скрываем индикатор загрузки
        hideLoading('cart-container');
        
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Не удалось удалить товар из корзины');
        hideLoading('cart-container');
    });
}

// Очистка корзины
function clearCart() {
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    // Подготавливаем заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    // Отправляем запрос на очистку корзины
    return fetch('/api/cart/clear/', {
        method: 'DELETE',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при очистке корзины');
        }
        return response.json();
    })
    .then(data => {
        // Обновляем состояние корзины
        cart = data;
        
        // Диспетчеризуем событие обновления корзины
        dispatchCartUpdatedEvent();
        
        // Показываем сообщение
        showMessage('Корзина очищена');
        
        // Обновляем отображение корзины
        renderCart();
        
        // Обновляем отображение карточек товаров в каталоге
        if (document.querySelector('.product-card')) {
            updateProductCardsInCatalog();
        }
        
        // Скрываем индикатор загрузки
        hideLoading('cart-container');
        
        // Гарантируем актуальные данные
        setTimeout(() => {
            loadCart();
        }, 500);
        
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Не удалось очистить корзину');
        hideLoading('cart-container');
    });
}

// Добавление товара в корзину
function addProductToCart(productId, quantity = 1) {
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    // Подготавливаем заголовки запроса
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    // Данные для запроса
    const data = {
        product_id: productId,
        quantity: quantity
    };
    
    // Отправляем запрос на добавление товара в корзину
    return fetch('/api/cart/add/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при добавлении товара в корзину');
        }
        return response.json();
    })
    .then(data => {
        // Обновляем состояние корзины
        cart = data;
        
        // Диспетчеризуем событие обновления корзины
        dispatchCartUpdatedEvent();
        
        // Показываем сообщение
        showMessage('Товар добавлен в корзину');
        
        // Обновляем отображение корзины (если отображается)
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer && getComputedStyle(cartContainer).display !== 'none') {
            renderCart();
        }
        
        // Обновляем отображение карточки товара в каталоге
        updateProductCardInCatalog(productId);
        
        // Запускаем анимацию добавления товара в корзину
        triggerAddToCartAnimation(productId);
        
        // Скрываем индикатор загрузки
        hideLoading('cart-container');
        
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Не удалось добавить товар в корзину');
        hideLoading('cart-container');
    });
}

// Обновление карточки товара в каталоге
function updateProductCardInCatalog(productId) {
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!productCard) return;
    
    // Находим товар в корзине
    let cartItem = null;
    if (cart && cart.items) {
        cartItem = cart.items.find(item => item.product.id === productId);
    }
    
    // Сохраняем состояние описания товара, если оно есть
    const descriptionElement = productCard.querySelector('.product-description');
    const showMoreBtn = productCard.querySelector('.show-more-btn');
    let isDescriptionExpanded = false;
    
    if (descriptionElement && descriptionElement.classList.contains('expanded')) {
        isDescriptionExpanded = true;
    }
    
    // Удаляем старую кнопку или контроль количества
    const oldButton = productCard.querySelector('.add-to-cart-btn');
    const oldControl = productCard.querySelector('.quantity-control');
    
    if (oldButton) oldButton.remove();
    if (oldControl) oldControl.remove();
    
    if (cartItem) {
        // Товар уже в корзине - показываем контроль количества и добавляем подсветку
        productCard.classList.add('product-in-cart');
        
        const quantityControl = document.createElement('div');
        quantityControl.className = 'quantity-control catalog-quantity-control';
        
        // Кнопка уменьшения количества
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn decrease-btn';
        decreaseBtn.textContent = '-';
        decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Добавляем вывод в консоль для отладки
            console.log(`Уменьшение количества для товара ${cartItem.product.name}, текущее количество: ${cartItem.quantity}`);
            updateCartItemQuantity(cartItem.id, cartItem.quantity - 1);
        });
        quantityControl.appendChild(decreaseBtn);
        
        // Поле с количеством
        const quantity = document.createElement('span');
        quantity.className = 'quantity-value';
        quantity.textContent = cartItem.quantity;
        quantityControl.appendChild(quantity);
        
        // Кнопка увеличения количества
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'quantity-btn increase-btn';
        increaseBtn.textContent = '+';
        increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Добавляем вывод в консоль для отладки
            console.log(`Увеличение количества для товара ${cartItem.product.name}, текущее количество: ${cartItem.quantity}`);
            updateCartItemQuantity(cartItem.id, cartItem.quantity + 1);
        });
        quantityControl.appendChild(increaseBtn);
        
        productCard.appendChild(quantityControl);
    } else {
        // Товара нет в корзине - убираем подсветку и показываем кнопку добавления
        productCard.classList.remove('product-in-cart');
        
        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'btn btn-small add-to-cart-btn';
        addToCartBtn.textContent = 'В корзину';
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addProductToCart(productId);
        });
        productCard.appendChild(addToCartBtn);
    }
    
    // Восстанавливаем состояние описания товара, если оно было развернуто
    if (isDescriptionExpanded) {
        const newDescriptionElement = productCard.querySelector('.product-description');
        const newShowMoreBtn = productCard.querySelector('.show-more-btn');
        
        if (newDescriptionElement && newShowMoreBtn) {
            newDescriptionElement.classList.remove('collapsed');
            newDescriptionElement.classList.add('expanded');
            newShowMoreBtn.textContent = 'Скрыть';
        }
    }
}

// Обновление отображения всех карточек товаров в каталоге
function updateProductCardsInCatalog() {
    if (!cart) {
        console.log('Cart is not loaded, skipping catalog update');
        return;
    }
    
    if (!cart.items || !Array.isArray(cart.items)) {
        console.error('cart.items не является массивом или отсутствует:', cart);
        return;
    }
    
    // Для каждого товара в текущем разделе обновляем отображение
    const productCards = document.querySelectorAll('.product-card');
    console.log(`Обновление ${productCards.length} карточек товаров в каталоге`);
    
    productCards.forEach(card => {
        const productId = parseInt(card.getAttribute('data-id'));
        if (productId) {
            updateProductCardInCatalog(productId);
        }
    });
}

// Показать индикатор загрузки
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Создаем индикатор загрузки, если его еще нет
    let loader = container.querySelector('.loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader';
        container.appendChild(loader);
    }
    
    loader.style.display = 'block';
}

// Скрыть индикатор загрузки
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loader = container.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Показать сообщение об ошибке
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Скрываем сообщение через 3 секунды
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Показать информационное сообщение
function showMessage(message) {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        
        // Скрываем сообщение через 3 секунды
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем корзину при переключении на вкладку корзины
    const cartTab = document.querySelector('.nav-button[data-tab="cart"]');
    if (cartTab) {
        cartTab.addEventListener('click', () => {
            // Всегда загружаем корзину при переключении на вкладку
            initCart();
        });
    }
    
    // Загружаем корзину при загрузке страницы
    loadCart();

    // Добавляем обработчик для перезагрузки корзины при возвращении на вкладку
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer && cartContainer.style.display === 'block') {
                loadCart();
            }
        }
    });

    // В JavaScript, при загрузке страницы
    const currentUrl = window.location.href;
    const timestamp = Date.now();
    const separator = currentUrl.includes('?') ? '&' : '?';
    const newUrl = `${currentUrl}${separator}t=${timestamp}`;
    window.history.replaceState({}, document.title, newUrl);
});

// Здесь добавляю функцию для обновления корзины с анимациями

// Функция для обновления общей суммы с анимацией
function updateTotalWithAnimation() {
    // Найдем элемент с общей суммой
    const totalElement = document.querySelector('.cart-total-value');
    if (totalElement) {
        // Добавляем класс для анимации
        totalElement.classList.add('updating');
        
        // Убираем класс после завершения анимации
        setTimeout(() => {
            totalElement.classList.remove('updating');
        }, 1000);
    }
}

// Функция для анимации удаления товара из корзины
function animateItemRemoval(itemElement, callback) {
    // Добавляем класс для анимации удаления
    itemElement.classList.add('removing');
    
    // Ждем завершения анимации и вызываем callback
    setTimeout(() => {
        if (callback && typeof callback === 'function') {
            callback();
        }
    }, 500); // Соответствует времени анимации в CSS
}

// Функция для анимации добавления товара в корзину
function triggerAddToCartAnimation(productId) {
    // Находим карточку товара
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (productCard) {
        // Добавляем класс для анимации и временной яркой подсветки
        productCard.classList.add('adding-to-cart');
        productCard.classList.add('product-added');
        
        // Убираем классы после завершения анимации, но сохраняем постоянную подсветку
        setTimeout(() => {
            productCard.classList.remove('adding-to-cart');
            setTimeout(() => {
                productCard.classList.remove('product-added');
                // Класс product-in-cart будет добавлен в функции updateProductCardInCatalog
            }, 300); // Уменьшено с 1000мс до 300мс
        }, 200); // Уменьшено с 500мс до 200мс
    }
}

// Функция для анимации состояния загрузки кнопки
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Событие для оповещения об изменении корзины
function dispatchCartUpdatedEvent() {
    window.dispatchEvent(new CustomEvent('cart-updated'));
}

// Функция для перехода к оформлению заказа
function proceedToCheckout() {
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Для оформления заказа необходимо авторизоваться');
        return;
    }
    
    // Перезагружаем корзину перед переходом к оформлению заказа
    loadCart().then(cartData => {
        // Проверяем, есть ли товары в корзине
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            showError('Ваша корзина пуста');
            return;
        }
        
        // Скрываем нижнюю навигацию
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
        
        // Скрываем корзину
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            cartContainer.style.display = 'none';
        }
        
        // Показываем страницу оформления заказа
        const checkoutContainer = document.getElementById('checkout-container');
        if (checkoutContainer) {
            checkoutContainer.style.display = 'block';
            // Инициализируем страницу оформления заказа
            initCheckout();
        }
    });
} 