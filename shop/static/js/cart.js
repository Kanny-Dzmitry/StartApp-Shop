// Функции для работы с корзиной

// Глобальная переменная для хранения состояния корзины
let cart = null;

// Инициализация корзины
function initCart() {
    // Применяем тему Telegram
    applyTelegramTheme();
    
    // Загружаем корзину при открытии вкладки
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
    
    return fetch('/api/cart/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении корзины');
            }
            return response.json();
        })
        .then(data => {
            cart = data;
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
    const checkoutButton = document.createElement('div');
    checkoutButton.className = 'checkout-button';
    
    if (cart && cart.items.length > 0) {
        // Текст кнопки
        checkoutButton.innerHTML = `
            <div class="checkout-button-text">К оформлению</div>
            <div class="checkout-button-info">${cart.total_items} шт., ${cart.total_price} ₽</div>
        `;
        
        // Добавляем эффект свечения
        checkoutButton.style.animation = 'pulse 2s infinite';
        
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
        checkoutButton.addEventListener('click', () => {
            // Здесь будет логика оформления заказа
            showMessage('Функционал оформления заказа будет доступен позже');
        });
    } else {
        // Если корзина пуста - неактивная кнопка
        checkoutButton.classList.add('disabled');
        checkoutButton.innerHTML = `
            <div class="checkout-button-text">К оформлению</div>
            <div class="checkout-button-info">Корзина пуста</div>
        `;
    }
    
    cartContainer.appendChild(checkoutButton);
    
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
        cart.items.forEach(item => {
            const cartItem = createCartItemElement(item);
            cartItems.appendChild(cartItem);
        });
        
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
    // Блокируем интерфейс на время обновления
    document.body.classList.add('updating');
    
    // Если количество 0 или меньше, удаляем товар
    if (newQuantity <= 0) {
        removeCartItem(itemId);
        return;
    }
    
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Сразу обновляем отображение количества в интерфейсе для плавности
    updateQuantityInUI(itemId, newQuantity);
    
    fetch(`/api/cart/update/${itemId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при обновлении количества товара');
            }
            return response.json();
        })
        .then(data => {
            cart = data;
            renderCart();
            hideLoading('cart-container');
            
            // Обновляем отображение карточек товаров в каталоге
            if (document.querySelector('.product-card')) {
                updateProductCardsInCatalog();
            }
            
            // Разблокируем интерфейс
            document.body.classList.remove('updating');
            
            // Оповещаем об изменении корзины для обновления счетчика
            dispatchCartUpdatedEvent();
            
            // Анимируем обновление общей суммы
            updateTotalWithAnimation();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось обновить количество товара');
            hideLoading('cart-container');
            
            // Разблокируем интерфейс
            document.body.classList.remove('updating');
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
    // Блокируем интерфейс на время обновления
    document.body.classList.add('updating');
    
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Найдем продукт, чтобы потом обновить отображение в каталоге
    const productId = cart.items.find(item => item.id === itemId)?.product.id;
    
    // Находим элемент корзины для анимации
    const cartItemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
    
    // Применяем анимацию удаления
    if (cartItemElement) {
        animateItemRemoval(cartItemElement, () => {
            // Делаем запрос на удаление после начала анимации
            fetch(`/api/cart/delete/${itemId}/`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при удалении товара из корзины');
                    }
                    return response.json();
                })
                .then(data => {
                    cart = data;
                    renderCart();
                    hideLoading('cart-container');
                    
                    // Обновляем отображение в каталоге для этого товара
                    if (productId) {
                        updateProductCardInCatalog(productId);
                    }
                    
                    // Разблокируем интерфейс
                    document.body.classList.remove('updating');
                    
                    // Оповещаем об изменении корзины для обновления счетчика
                    dispatchCartUpdatedEvent();
                    
                    // Анимируем обновление общей суммы
                    updateTotalWithAnimation();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('Не удалось удалить товар из корзины');
                    hideLoading('cart-container');
                    
                    // Разблокируем интерфейс
                    document.body.classList.remove('updating');
                });
        });
    } else {
        // Если элемент не найден, выполняем обычное удаление без анимации
        fetch(`/api/cart/delete/${itemId}/`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при удалении товара из корзины');
                }
                return response.json();
            })
            .then(data => {
                cart = data;
                renderCart();
                hideLoading('cart-container');
                
                // Обновляем отображение в каталоге для этого товара
                if (productId) {
                    updateProductCardInCatalog(productId);
                }
                
                // Разблокируем интерфейс
                document.body.classList.remove('updating');
                
                // Оповещаем об изменении корзины для обновления счетчика
                dispatchCartUpdatedEvent();
                
                // Анимируем обновление общей суммы
                updateTotalWithAnimation();
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Не удалось удалить товар из корзины');
                hideLoading('cart-container');
                
                // Разблокируем интерфейс
                document.body.classList.remove('updating');
            });
    }
}

// Очистка корзины
function clearCart() {
    // Блокируем интерфейс на время обновления
    document.body.classList.add('updating');
    
    // Показываем индикатор загрузки
    showLoading('cart-container');
    
    // Добавляем анимацию удаления для всех элементов корзины
    const cartItems = document.querySelectorAll('.cart-item');
    if (cartItems.length > 0) {
        cartItems.forEach(item => {
            item.classList.add('removing');
        });
        
        // Даем время для анимации перед фактическим удалением
        setTimeout(() => {
            fetch('/api/cart/clear/', {
                method: 'POST',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при очистке корзины');
                    }
                    return response.json();
                })
                .then(data => {
                    cart = data;
                    renderCart();
                    hideLoading('cart-container');
                    
                    // Обновляем отображение карточек товаров в каталоге
                    if (document.querySelector('.product-card')) {
                        updateProductCardsInCatalog();
                    }
                    
                    // Разблокируем интерфейс
                    document.body.classList.remove('updating');
                    
                    // Оповещаем об изменении корзины для обновления счетчика
                    dispatchCartUpdatedEvent();
                    
                    // Анимируем обновление общей суммы
                    updateTotalWithAnimation();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('Не удалось очистить корзину');
                    hideLoading('cart-container');
                    
                    // Разблокируем интерфейс
                    document.body.classList.remove('updating');
                });
        }, 300); // Половина времени анимации для плавности
    } else {
        // Если элементы не найдены, выполняем обычную очистку без анимации
        fetch('/api/cart/clear/', {
            method: 'POST',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при очистке корзины');
                }
                return response.json();
            })
            .then(data => {
                cart = data;
                renderCart();
                hideLoading('cart-container');
                
                // Обновляем отображение карточек товаров в каталоге
                if (document.querySelector('.product-card')) {
                    updateProductCardsInCatalog();
                }
                
                // Разблокируем интерфейс
                document.body.classList.remove('updating');
                
                // Оповещаем об изменении корзины для обновления счетчика
                dispatchCartUpdatedEvent();
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Не удалось очистить корзину');
                hideLoading('cart-container');
                
                // Разблокируем интерфейс
                document.body.classList.remove('updating');
            });
    }
}

// Функция для добавления товара в корзину (используется из catalog.js)
function addProductToCart(productId, quantity = 1) {
    // Блокируем интерфейс на время обновления
    document.body.classList.add('updating');
    
    // Находим кнопку добавления в корзину и добавляем анимацию загрузки
    const addToCartBtn = document.querySelector(`.product-card[data-id="${productId}"] .add-to-cart-btn`);
    if (addToCartBtn) {
        setButtonLoading(addToCartBtn, true);
    }
    
    // Показываем индикатор загрузки
    showLoading('catalog-content');
    
    fetch('/api/cart/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при добавлении товара в корзину');
            }
            return response.json();
        })
        .then(data => {
            cart = data;
            hideLoading('catalog-content');
            
            // Обновляем отображение кнопки "В корзину" в каталоге
            updateProductCardInCatalog(productId);
            
            // Разблокируем интерфейс
            document.body.classList.remove('updating');
            
            // Убираем анимацию загрузки с кнопки
            if (addToCartBtn) {
                setButtonLoading(addToCartBtn, false);
            }
            
            // Анимируем добавление товара в корзину
            triggerAddToCartAnimation(productId);
            
            // Оповещаем об изменении корзины для обновления счетчика
            dispatchCartUpdatedEvent();
            
            // Анимируем обновление общей суммы
            updateTotalWithAnimation();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось добавить товар в корзину');
            hideLoading('catalog-content');
            
            // Разблокируем интерфейс
            document.body.classList.remove('updating');
            
            // Убираем анимацию загрузки с кнопки
            if (addToCartBtn) {
                setButtonLoading(addToCartBtn, false);
            }
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
    if (!cart) return;
    
    // Для каждого товара в текущем разделе обновляем отображение
    const productCards = document.querySelectorAll('.product-card');
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
            if (!cart) {
                initCart();
            } else {
                renderCart();
            }
        });
    }
    
    // Загружаем корзину при загрузке страницы
    loadCart();
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