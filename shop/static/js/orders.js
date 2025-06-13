// Функции для работы с историей заказов

// Получение истории заказов пользователя
function loadOrderHistory() {
    const token = getAuthToken();
    
    if (!token) {
        return;
    }
    
    fetch('/api/accounts/profile/orders/', {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении истории заказов');
        }
        return response.json();
    })
    .then(orders => {
        displayOrders(orders);
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось загрузить историю заказов");
    });
}

// Отображение списка заказов
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) return;
    
    // Очищаем предыдущее содержимое
    ordersList.innerHTML = '';
    
    // Отображаем заказы
    if (orders.length === 0) {
        const noOrders = document.createElement('p');
        noOrders.className = 'no-orders';
        noOrders.textContent = 'У вас пока нет заказов';
        ordersList.appendChild(noOrders);
    } else {
        // Сортируем заказы по дате (сначала новые)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        orders.forEach(order => {
            const orderElement = createOrderElement(order);
            ordersList.appendChild(orderElement);
        });
    }
}

// Создание элемента заказа
function createOrderElement(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.dataset.orderId = order.id;
    
    // Заголовок заказа
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    
    const orderId = document.createElement('div');
    orderId.className = 'order-id';
    orderId.textContent = `Заказ #${order.id}`;
    orderHeader.appendChild(orderId);
    
    const orderDate = document.createElement('div');
    orderDate.className = 'order-date';
    orderDate.textContent = formatDate(order.created_at);
    orderHeader.appendChild(orderDate);
    
    orderElement.appendChild(orderHeader);
    
    // Информация о заказе
    const orderInfo = document.createElement('div');
    orderInfo.className = 'order-info';
    
    const itemsCount = document.createElement('p');
    itemsCount.className = 'order-items-count';
    itemsCount.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Товаров: ${order.items_count}
    `;
    orderInfo.appendChild(itemsCount);
    
    const totalPrice = document.createElement('p');
    totalPrice.className = 'order-total';
    totalPrice.textContent = `Сумма заказа: ${formatPrice(order.total_price)} ₽`;
    orderInfo.appendChild(totalPrice);
    
    orderElement.appendChild(orderInfo);
    
    // Кнопка для раскрытия/скрытия деталей заказа
    const toggleButton = document.createElement('button');
    toggleButton.className = 'order-toggle-btn';
    toggleButton.innerHTML = `
        <span class="toggle-text">Подробнее</span>
        <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    orderElement.appendChild(toggleButton);
    
    // Контейнер для деталей заказа (изначально скрыт)
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'order-details-container';
    detailsContainer.style.display = 'none';
    detailsContainer.dataset.orderId = order.id;
    
    // Обработчик нажатия на кнопку раскрытия/скрытия
    toggleButton.addEventListener('click', () => {
        if (detailsContainer.style.display === 'none') {
            // Если детали скрыты, загружаем и показываем их
            detailsContainer.style.display = 'block';
            toggleButton.classList.add('active');
            toggleButton.querySelector('.toggle-text').textContent = 'Скрыть';
            
            // Загружаем детали заказа, если они еще не загружены
            if (detailsContainer.children.length === 0) {
                loadOrderDetails(order.id, detailsContainer);
            }
        } else {
            // Если детали показаны, скрываем их
            detailsContainer.style.display = 'none';
            toggleButton.classList.remove('active');
            toggleButton.querySelector('.toggle-text').textContent = 'Подробнее';
        }
    });
    
    orderElement.appendChild(detailsContainer);
    
    return orderElement;
}

// Загрузка деталей заказа
function loadOrderDetails(orderId, container) {
    const token = getAuthToken();
    
    if (!token) {
        return;
    }
    
    // Показываем индикатор загрузки
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    fetch(`/api/orders/${orderId}/`, {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении деталей заказа');
        }
        return response.json();
    })
    .then(orderDetails => {
        showOrderDetails(orderDetails, container);
    })
    .catch(error => {
        console.error('Error:', error);
        container.innerHTML = '<p class="error-message">Не удалось загрузить детали заказа</p>';
    });
}

// Отображение деталей заказа
function showOrderDetails(order, container) {
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Информация о дате и способе оплаты
    const orderInfo = document.createElement('div');
    orderInfo.className = 'order-general-info';
    
    // Получаем отображаемый способ оплаты
    let paymentMethodDisplay = order.payment_method_display;
    if (!paymentMethodDisplay) {
        switch(order.payment_method) {
            case 'cash': paymentMethodDisplay = 'Наличными при получении'; break;
            case 'card': paymentMethodDisplay = 'Картой при получении'; break;
            default: paymentMethodDisplay = order.payment_method;
        }
    }
    
    orderInfo.innerHTML = `
        <p><strong>Дата заказа:</strong> ${formatDate(order.created_at)}</p>
        <p><strong>Способ оплаты:</strong> ${paymentMethodDisplay}</p>
    `;
    container.appendChild(orderInfo);
    
    // Адрес доставки
    if (order.address) {
        const addressInfo = document.createElement('div');
        addressInfo.className = 'order-address-info';
        
        const address = order.address.address;
        let addressText = `${address.district}, ${address.street}`;
        if (address.house_number) addressText += `, д. ${address.house_number}`;
        if (address.apartment) addressText += `, кв. ${address.apartment}`;
        if (address.floor) addressText += `, этаж ${address.floor}`;
        
        addressInfo.innerHTML = `<p><strong>Адрес доставки:</strong> ${addressText}</p>`;
        container.appendChild(addressInfo);
    }
    
    // Список товаров
    const productsContainer = document.createElement('div');
    productsContainer.className = 'order-products';
    productsContainer.innerHTML = '<h4>Товары в заказе:</h4>';
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const productItem = document.createElement('div');
            productItem.className = 'order-product-item';
            
            const productName = document.createElement('div');
            productName.className = 'order-product-name';
            productName.textContent = item.product_name;
            productItem.appendChild(productName);
            
            const productQuantity = document.createElement('div');
            productQuantity.className = 'order-product-quantity';
            productQuantity.textContent = `${item.quantity} шт.`;
            productItem.appendChild(productQuantity);
            
            const productPrice = document.createElement('div');
            productPrice.className = 'order-product-price';
            productPrice.textContent = `${formatPrice(item.product_price * item.quantity)} ₽`;
            productItem.appendChild(productPrice);
            
            productsContainer.appendChild(productItem);
        });
    } else {
        productsContainer.innerHTML += '<p>Информация о товарах недоступна</p>';
    }
    
    container.appendChild(productsContainer);
    
    // Итоговая информация
    const summaryInfo = document.createElement('div');
    summaryInfo.className = 'order-summary';
    
    if (order.delivery_cost > 0) {
        const deliveryCost = document.createElement('p');
        deliveryCost.innerHTML = `<span>Стоимость доставки:</span> <span>${formatPrice(order.delivery_cost)} ₽</span>`;
        summaryInfo.appendChild(deliveryCost);
    }
    
    const totalPrice = document.createElement('p');
    totalPrice.className = 'order-total';
    totalPrice.innerHTML = `<span>Итого:</span> <span>${formatPrice(order.total_price)} ₽</span>`;
    summaryInfo.appendChild(totalPrice);
    
    container.appendChild(summaryInfo);
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Форматирование цены
function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Переключение между профилем и историей заказов
function showOrdersHistory() {
    document.getElementById('profile-container').style.display = 'none';
    document.getElementById('orders-container').style.display = 'block';
    
    // Загружаем историю заказов
    loadOrderHistory();
}

function showProfile() {
    document.getElementById('orders-container').style.display = 'none';
    document.getElementById('profile-container').style.display = 'block';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Обработчик для кнопки просмотра истории заказов
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', showOrdersHistory);
    }
    
    // Обработчик для кнопки возврата в профиль
    const backToProfileBtn = document.getElementById('back-to-profile-btn');
    if (backToProfileBtn) {
        backToProfileBtn.addEventListener('click', showProfile);
    }
    
    // Загружаем историю заказов при отображении профиля
    const profileTab = document.querySelector('.nav-button[data-tab="profile"]');
    if (profileTab) {
        profileTab.addEventListener('click', () => {
            // Показываем профиль при клике на вкладку профиля
            showProfile();
        });
    }
    
    // Добавляем обработчики для всех навигационных кнопок, чтобы скрывать историю заказов
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        if (button.getAttribute('data-tab') !== 'profile') {
            button.addEventListener('click', () => {
                // Скрываем историю заказов при переключении на другие вкладки
                const ordersContainer = document.getElementById('orders-container');
                if (ordersContainer) {
                    ordersContainer.style.display = 'none';
                }
            });
        }
    });
    
    // Также загружаем историю заказов при успешной авторизации
    window.addEventListener('auth-success', () => {
        // Если профиль видим, загружаем историю заказов
        const profileContainer = document.getElementById('profile-container');
        if (profileContainer && profileContainer.style.display === 'block') {
            // Ничего не делаем, пока пользователь не нажмет на кнопку истории заказов
        }
    });
}); 