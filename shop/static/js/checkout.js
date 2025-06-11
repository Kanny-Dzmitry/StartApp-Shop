// Глобальные переменные
let userData = null;
let cartData = null;
let userAddresses = [];
let selectedAddressId = null;
let selectedPaymentMethod = 'cash';
let orderComment = '';
let deliverySettings = {
    free_delivery_threshold: 8000,
    delivery_cost: 1000
};

// Инициализация страницы оформления заказа
function initCheckout() {
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Для оформления заказа необходимо авторизоваться');
        
        // Возвращаемся на вкладку корзины
        setTimeout(() => {
            const cartTab = document.querySelector('.nav-button[data-tab="cart"]');
            if (cartTab) {
                cartTab.click();
            }
        }, 2000);
        
        return;
    }
    
    // Получаем настройки доставки
    fetchDeliverySettings();
    
    // Получаем данные пользователя
    fetchUserData();
    
    // Получаем данные корзины
    fetchCartData().then(data => {
        // Проверяем, есть ли товары в корзине
        if (!data || !data.items || data.items.length === 0) {
            showError('Ваша корзина пуста');
            
            // Возвращаемся на вкладку корзины
            setTimeout(() => {
                const cartTab = document.querySelector('.nav-button[data-tab="cart"]');
                if (cartTab) {
                    cartTab.click();
                }
            }, 2000);
            
            return;
        }
        
        // Получаем адреса пользователя
        fetchUserAddresses();
        
        // Настраиваем кнопку возврата в корзину
        setupBackButton();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        // Инициализация выбранного способа оплаты
        initializePaymentMethod();
        
        // Инициализация обработчика для поля комментария
        initializeCommentField();
    });
}

// Получение настроек доставки
function fetchDeliverySettings() {
    return fetch('/api/orders/delivery/settings/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось получить настройки доставки');
            }
            return response.json();
        })
        .then(data => {
            deliverySettings = data;
            console.log('Настройки доставки:', deliverySettings);
            
            // Если данные корзины уже получены, обновляем сводку заказа
            if (cartData) {
                renderOrderSummary();
            }
            
            return data;
        })
        .catch(error => {
            console.error('Error:', error);
            // Используем значения по умолчанию
            return deliverySettings;
        });
}

// Получение данных пользователя с сервера
function fetchUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Для оформления заказа необходимо авторизоваться');
        return;
    }
    
    fetch('/api/checkout/', {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Не удалось получить данные пользователя');
        }
        return response.json();
    })
    .then(data => {
        userData = data.user;
        renderUserInfo();
    })
    .catch(error => {
        showError(error.message);
    });
}

// Получение данных корзины
function fetchCartData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Для оформления заказа необходимо авторизоваться');
        return Promise.reject(new Error('Отсутствует токен авторизации'));
    }
    
    return fetch('/api/cart/', {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Не удалось получить данные корзины');
        }
        return response.json();
    })
    .then(data => {
        cartData = data;
        renderOrderSummary();
        
        // Валидируем форму заказа после получения данных корзины
        validateOrderForm();
        
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Не удалось получить данные корзины');
        return null;
    });
}

// Получение адресов пользователя
function fetchUserAddresses() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    fetch('/api/accounts/addresses/', {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении адресов');
        }
        return response.json();
    })
    .then(addresses => {
        userAddresses = addresses;
        
        // Если есть хотя бы один адрес, выбираем его по умолчанию
        if (addresses && addresses.length > 0) {
            // Ищем адрес по умолчанию
            const defaultAddress = addresses.find(addr => addr.is_default);
            
            // Если есть адрес по умолчанию, выбираем его
            if (defaultAddress) {
                selectedAddressId = defaultAddress.id;
            } else {
                // Иначе выбираем первый адрес в списке
                selectedAddressId = addresses[0].id;
            }
            
            console.log('Выбран адрес по умолчанию:', selectedAddressId);
        }
        
        // Отрисовываем адреса
        renderAddresses();
        
        // После отрисовки адресов, повторно проверяем валидность формы
        setTimeout(validateOrderForm, 200);
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось загрузить адреса");
    });
}

// Отображение информации о пользователе
function renderUserInfo() {
    if (!userData) return;
    
    const userInfoContainer = document.getElementById('checkout-user-info');
    if (!userInfoContainer) return;
    
    userInfoContainer.innerHTML = '';
    
    // Создаем элементы для отображения информации о пользователе
    const fields = [
        { label: 'Имя', value: userData.first_name || 'Не указано' },
        { label: 'Фамилия', value: userData.last_name || 'Не указано' },
        { label: 'Телефон', value: userData.phone_number || 'Не указано' }
    ];
    
    fields.forEach(field => {
        const item = document.createElement('div');
        item.className = 'user-info-item';
        
        const label = document.createElement('div');
        label.className = 'user-info-label';
        label.textContent = field.label + ':';
        
        const value = document.createElement('div');
        value.className = 'user-info-value';
        value.textContent = field.value;
        
        item.appendChild(label);
        item.appendChild(value);
        userInfoContainer.appendChild(item);
    });
    
    // Проверяем наличие номера телефона
    if (!userData.phone_number) {
        const noPhone = document.createElement('div');
        noPhone.className = 'error-message';
        noPhone.textContent = '⚠️ У вас не указан номер телефона. Вы не сможете оформить заказ.';
        userInfoContainer.appendChild(noPhone);
    }
}

// Отображение адресов пользователя
function renderAddresses() {
    const addressesList = document.getElementById('checkout-addresses-list');
    if (!addressesList) return;
    
    // Очищаем список
    addressesList.innerHTML = '';
    
    // Добавляем заголовок "Выберите адрес доставки"
    const selectAddressTitle = document.createElement('h4');
    selectAddressTitle.className = 'select-address-title';
    selectAddressTitle.textContent = 'Выберите адрес доставки:';
    addressesList.appendChild(selectAddressTitle);
    
    // Если нет адресов, показываем выделенное сообщение
    if (userAddresses.length === 0) {
        const noAddresses = document.createElement('div');
        noAddresses.className = 'error-message';
        noAddresses.textContent = '⚠️ У вас не добавлен адрес доставки. Вы не сможете оформить заказ.';
        addressesList.appendChild(noAddresses);
    } else {
        // Создаем контейнер для адресов
        const addressCardsContainer = document.createElement('div');
        addressCardsContainer.className = 'address-cards-container';
        
        // Отображаем список адресов
        userAddresses.forEach(addressItem => {
            const address = addressItem.address;
            const addressElement = document.createElement('div');
            addressElement.className = 'address-item';
            addressElement.dataset.addressId = addressItem.id;
            
            // Если это выбранный адрес, добавляем класс selected и применяем стили
            if (addressItem.id === selectedAddressId) {
                addressElement.classList.add('selected');
                // Явно меняем стили для выделения
                addressElement.style.borderColor = '#4CAF50';
                addressElement.style.borderWidth = '3px';
                addressElement.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
                addressElement.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                console.log('Изначально выбранный адрес:', addressItem.id, addressElement);
            }
            
            // Добавляем обработчик клика для выбора адреса
            addressElement.addEventListener('click', (e) => {
                // Визуальный эффект нажатия
                addressElement.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    addressElement.style.transform = '';
                }, 150);
                
                // Выбираем адрес
                selectAddress(addressItem.id);
                
                // Предотвращаем всплытие события
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Название адреса
            const addressName = document.createElement('h4');
            addressName.className = 'address-name';
            addressName.textContent = addressItem.name || 'Адрес';
            if (addressItem.is_default) {
                const defaultBadge = document.createElement('span');
                defaultBadge.className = 'default-badge';
                defaultBadge.textContent = 'По умолчанию';
                addressName.appendChild(defaultBadge);
            }
            addressElement.appendChild(addressName);
            
            // Детали адреса
            const addressDetails = document.createElement('div');
            addressDetails.className = 'address-details';
            
            const district = document.createElement('p');
            district.innerHTML = `<strong>Район:</strong> ${address.district || 'Не указан'}`;
            addressDetails.appendChild(district);
            
            const street = document.createElement('p');
            street.innerHTML = `<strong>Улица:</strong> ${address.street || 'Не указана'}`;
            addressDetails.appendChild(street);
            
            const house = document.createElement('p');
            house.innerHTML = `<strong>Дом:</strong> ${address.house_number || 'Не указан'}`;
            addressDetails.appendChild(house);
            
            if (address.floor) {
                const floor = document.createElement('p');
                floor.innerHTML = `<strong>Этаж:</strong> ${address.floor}`;
                addressDetails.appendChild(floor);
            }
            
            if (address.apartment) {
                const apartment = document.createElement('p');
                apartment.innerHTML = `<strong>Квартира:</strong> ${address.apartment}`;
                addressDetails.appendChild(apartment);
            }
            
            addressElement.appendChild(addressDetails);
            addressCardsContainer.appendChild(addressElement);
        });
        
        // Добавляем контейнер с адресами в список адресов
        addressesList.appendChild(addressCardsContainer);
    }
    
    // Обязательно проверяем валидность формы после отрисовки адресов
    setTimeout(() => {
        validateOrderForm();
    }, 100);
}

// Выбор адреса
function selectAddress(addressId) {
    selectedAddressId = addressId;
    
    // Обновляем UI, чтобы отразить выбранный адрес
    const addressItems = document.querySelectorAll('.address-item');
    addressItems.forEach(item => {
        if (item.dataset.addressId === addressId.toString()) {
            // Добавляем классы выбранного адреса
            item.classList.add('selected');
            // Явно меняем стили для выделения
            item.style.borderColor = '#4CAF50';
            item.style.borderWidth = '3px';
            item.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
            item.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            
            // Добавляем анимацию для привлечения внимания
            item.classList.add('address-selected-animation');
            
            // Показываем сообщение о выборе адреса
            showMessage(`Адрес "${item.querySelector('.address-name').textContent.trim()}" выбран`);
            
            // Убираем анимацию через некоторое время
            setTimeout(() => {
                item.classList.remove('address-selected-animation');
            }, 1000);
            
            console.log('Адрес выбран:', addressId, item);
        } else {
            // Сбрасываем стили для невыбранных адресов
            item.classList.remove('selected');
            item.classList.remove('address-selected-animation');
            item.style.borderColor = '#e0e0e0';
            item.style.borderWidth = '2px';
            item.style.backgroundColor = '';
            item.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        }
    });
    
    // Проверяем возможность оформления заказа
    validateOrderForm();
}

// Отображение сводки заказа
function renderOrderSummary() {
    if (!cartData) return;
    
    const orderSummary = document.getElementById('checkout-order-summary');
    if (!orderSummary) return;
    
    // Очищаем контейнер
    orderSummary.innerHTML = '';
    
    // Создаем контейнер для товаров
    const orderItems = document.createElement('div');
    orderItems.className = 'order-items';
    
    // Если в корзине нет товаров
    if (!cartData.items || cartData.items.length === 0) {
        const emptyCart = document.createElement('p');
        emptyCart.textContent = 'Ваша корзина пуста';
        orderItems.appendChild(emptyCart);
        orderSummary.appendChild(orderItems);
        return;
    }
    
    // Добавляем товары из корзины
    cartData.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'checkout-cart-item';
        
        // Изображение товара
        const itemImage = document.createElement('div');
        itemImage.className = 'checkout-item-image';
        if (item.product.image) {
            const img = document.createElement('img');
            img.src = item.product.image;
            img.alt = item.product.name;
            itemImage.appendChild(img);
        } else {
            const noImage = document.createElement('div');
            noImage.className = 'no-image';
            noImage.textContent = '📦';
            itemImage.appendChild(noImage);
        }
        cartItem.appendChild(itemImage);
        
        // Информация о товаре
        const itemInfo = document.createElement('div');
        itemInfo.className = 'checkout-item-info';
        
        const itemName = document.createElement('div');
        itemName.className = 'checkout-item-name';
        itemName.textContent = item.product.name;
        itemInfo.appendChild(itemName);
        
        const itemPrice = document.createElement('div');
        itemPrice.className = 'checkout-item-price';
        itemPrice.textContent = `${item.quantity} x ${item.product.price} ₽ = ${item.quantity * item.product.price} ₽`;
        itemInfo.appendChild(itemPrice);
        
        cartItem.appendChild(itemInfo);
        orderItems.appendChild(cartItem);
    });
    
    orderSummary.appendChild(orderItems);
    
    // Рассчитываем стоимость доставки
    const cartTotal = parseFloat(cartData.total_price);
    const freeDeliveryThreshold = parseFloat(deliverySettings.free_delivery_threshold);
    const deliveryCost = parseFloat(deliverySettings.delivery_cost);
    
    // Определяем, бесплатная ли доставка
    const isFreeDelivery = cartTotal >= freeDeliveryThreshold;
    const finalDeliveryCost = isFreeDelivery ? 0 : deliveryCost;
    
    // Рассчитываем итоговую сумму с доставкой
    const totalWithDelivery = cartTotal + finalDeliveryCost;
    
    // Добавляем итоговую сумму
    const orderTotals = document.createElement('div');
    orderTotals.className = 'order-totals';
    
    // Подитог
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'order-total-row';
    
    const subtotalLabel = document.createElement('div');
    subtotalLabel.textContent = 'Подитог:';
    subtotalRow.appendChild(subtotalLabel);
    
    const subtotalValue = document.createElement('div');
    subtotalValue.textContent = `${cartData.total_price} ₽`;
    subtotalRow.appendChild(subtotalValue);
    
    orderTotals.appendChild(subtotalRow);
    
    // Доставка
    const deliveryRow = document.createElement('div');
    deliveryRow.className = 'order-total-row';
    
    const deliveryLabel = document.createElement('div');
    deliveryLabel.textContent = 'Доставка:';
    deliveryRow.appendChild(deliveryLabel);
    
    const deliveryValue = document.createElement('div');
    if (isFreeDelivery) {
        deliveryValue.textContent = 'Бесплатно';
        deliveryValue.style.color = '#4CAF50';
    } else {
        deliveryValue.textContent = `${deliveryCost} ₽`;
    }
    deliveryRow.appendChild(deliveryValue);
    
    orderTotals.appendChild(deliveryRow);
    
    // Информация о бесплатной доставке
    if (!isFreeDelivery) {
        const deliveryInfoRow = document.createElement('div');
        deliveryInfoRow.className = 'order-delivery-info';
        
        const deliveryInfo = document.createElement('div');
        const remainingForFree = freeDeliveryThreshold - cartTotal;
        deliveryInfo.textContent = `Добавьте товаров на ${remainingForFree.toFixed(2)} ₽ для бесплатной доставки`;
        deliveryInfo.style.color = '#ff9800';
        deliveryInfo.style.fontSize = '0.9em';
        deliveryInfo.style.marginTop = '5px';
        deliveryInfoRow.appendChild(deliveryInfo);
        
        orderTotals.appendChild(deliveryInfoRow);
    }
    
    // Итого
    const totalRow = document.createElement('div');
    totalRow.className = 'order-total-row final';
    
    const totalLabel = document.createElement('div');
    totalLabel.textContent = 'Итого:';
    totalRow.appendChild(totalLabel);
    
    const totalValue = document.createElement('div');
    totalValue.textContent = `${totalWithDelivery.toFixed(2)} ₽`;
    totalValue.style.fontWeight = 'bold';
    totalRow.appendChild(totalValue);
    
    orderTotals.appendChild(totalRow);
    
    orderSummary.appendChild(orderTotals);
    
    // Проверяем возможность оформления заказа
    validateOrderForm();
}

// Настройка кнопки возврата в корзину
function setupBackButton() {
    const backButton = document.getElementById('back-to-cart-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            // Скрываем страницу оформления заказа
            const checkoutContainer = document.getElementById('checkout-container');
            if (checkoutContainer) {
                checkoutContainer.style.display = 'none';
            }
            
            // Показываем корзину
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer) {
                cartContainer.style.display = 'block';
                
                // Перезагружаем корзину при возврате
                if (typeof loadCart === 'function') {
                    loadCart();
                }
            }
            
            // Показываем нижнюю навигацию
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'flex';
            }
        });
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    
    // Обработчик для выбора способа оплаты
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            selectedPaymentMethod = e.target.value;
            
            // Визуальное выделение выбранного метода оплаты
            const paymentMethodItems = document.querySelectorAll('.payment-method-item');
            paymentMethodItems.forEach(item => {
                const radio = item.querySelector('input[type="radio"]');
                if (radio && radio.value === selectedPaymentMethod) {
                    // Добавляем класс выбранного метода
                    item.classList.add('selected');
                    
                    // Явно меняем стили для выделения
                    item.style.borderColor = '#4CAF50';
                    item.style.borderWidth = '3px';
                    item.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
                    item.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                    
                    // Показываем сообщение о выборе способа оплаты
                    const methodTitle = item.querySelector('.payment-method-title').textContent;
                    showMessage(`Выбран способ оплаты: ${methodTitle}`);
                    
                    console.log('Выбран способ оплаты:', selectedPaymentMethod, item);
                } else {
                    // Сбрасываем стили для невыбранных методов
                    item.classList.remove('selected');
                    item.style.borderColor = '#e0e0e0';
                    item.style.borderWidth = '2px';
                    item.style.backgroundColor = '';
                    item.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }
            });
        });
    });
    
    // Обработчик для кнопки оформления заказа
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener('click', submitOrder);
    }
}

// Инициализация выбранного способа оплаты
function initializePaymentMethod() {
    console.log('Инициализация способа оплаты:', selectedPaymentMethod);
    
    // Находим выбранный метод оплаты
    const selectedRadio = document.querySelector(`input[name="payment-method"][value="${selectedPaymentMethod}"]`);
    if (selectedRadio) {
        // Если метод найден, визуально отмечаем его
        const paymentMethodItem = selectedRadio.closest('.payment-method-item');
        if (paymentMethodItem) {
            paymentMethodItem.classList.add('selected');
            
            // Явно меняем стили для выделения
            paymentMethodItem.style.borderColor = '#4CAF50';
            paymentMethodItem.style.borderWidth = '3px';
            paymentMethodItem.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
            paymentMethodItem.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            
            console.log('Визуально отмечен способ оплаты:', selectedPaymentMethod, paymentMethodItem);
        }
    }
}

// Инициализация поля комментария
function initializeCommentField() {
    const commentField = document.getElementById('order-comment');
    const commentLength = document.getElementById('comment-length');
    
    if (commentField && commentLength) {
        // Обновляем счетчик символов при вводе
        commentField.addEventListener('input', function() {
            orderComment = this.value;
            const length = this.value.length;
            commentLength.textContent = length;
            
            // Меняем цвет счетчика, если близко к лимиту
            if (length > 450) {
                commentLength.style.color = '#e60000';
            } else if (length > 400) {
                commentLength.style.color = '#ff9800';
            } else {
                commentLength.style.color = '';
            }
        });
    }
}

// Проверка формы заказа
function validateOrderForm() {
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (!completeOrderBtn) return;
    
    // Проверяем наличие товаров в корзине
    const hasItems = cartData && cartData.items && cartData.items.length > 0;
    
    // Проверяем выбран ли адрес
    const hasAddress = !!selectedAddressId;
    
    // Проверяем наличие номера телефона
    const hasPhone = userData && userData.phone_number;
    
    // Активируем или деактивируем кнопку оформления заказа
    completeOrderBtn.disabled = !(hasItems && hasAddress && hasPhone);
    
    console.log('Валидация формы заказа:', {hasItems, hasAddress, hasPhone, buttonDisabled: completeOrderBtn.disabled});
}

// Отправка заказа на сервер
function submitOrder() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Для оформления заказа необходимо авторизоваться');
        return;
    }
    
    // Проверяем наличие выбранного адреса
    if (!selectedAddressId) {
        showError('Выберите адрес доставки');
        return;
    }
    
    // Проверяем наличие товаров в корзине
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        showError('Ваша корзина пуста');
        return;
    }
    
    // Проверяем наличие номера телефона
    if (!userData || !userData.phone_number) {
        showError('Необходимо указать номер телефона в профиле');
        return;
    }
    
    // Показываем индикатор загрузки
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (completeOrderBtn) {
        completeOrderBtn.disabled = true;
        completeOrderBtn.innerHTML = '<span class="loader"></span> Оформление...';
    }
    
    // Получаем выбранный адрес для отображения в сообщении
    const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId);
    const addressText = selectedAddress ? selectedAddress.address : '';
    
    // Получаем способ оплаты для сообщения
    const paymentText = selectedPaymentMethod === 'cash' ? 'Наличными при получении' : 'Картой при получении';
    
    // Получаем текст комментария
    const commentText = document.getElementById('order-comment') ? document.getElementById('order-comment').value.trim() : '';
    
    // Рассчитываем стоимость доставки
    const cartTotal = parseFloat(cartData.total_price);
    const freeDeliveryThreshold = parseFloat(deliverySettings.free_delivery_threshold);
    const deliveryCost = parseFloat(deliverySettings.delivery_cost);
    
    // Определяем, бесплатная ли доставка
    const isFreeDelivery = cartTotal >= freeDeliveryThreshold;
    const finalDeliveryCost = isFreeDelivery ? 0 : deliveryCost;
    
    // Рассчитываем итоговую сумму с доставкой
    const totalWithDelivery = cartTotal + finalDeliveryCost;
    
    // Собираем полные данные для отправки на сервер
    const orderData = {
        address_id: selectedAddressId,
        payment_method: selectedPaymentMethod,
        // Дополнительная информация для сохранения в заказе
        user_info: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number,
            email: userData.email
        },
        comment: commentText, // Добавляем комментарий
        total_items: cartData.items.length,
        total_price: totalWithDelivery.toFixed(2),
        delivery_cost: finalDeliveryCost.toFixed(2)
    };
    
    // Сохраняем данные заказа для сообщения о результате
    const orderSummary = {
        items: cartData.items.length,
        total: totalWithDelivery.toFixed(2),
        delivery_cost: finalDeliveryCost.toFixed(2),
        address: addressText,
        payment: paymentText,
        comment: commentText
    };
    
    // Отправляем запрос на сервер
    fetch('/api/orders/create/', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Не удалось оформить заказ');
            });
        }
        return response.json();
    })
    .then(data => {
        // Подготавливаем информативное сообщение с номером заказа
        const orderMessage = `
            Заказ #${data.id || 'N/A'} успешно принят!
            Сумма: ${data.total_price || orderSummary.total} ₽
            ${parseFloat(data.delivery_cost || orderSummary.delivery_cost) > 0 ? `Доставка: ${data.delivery_cost || orderSummary.delivery_cost} ₽` : 'Доставка: Бесплатно'}
            Оплата: ${data.payment_method || orderSummary.payment}
            Статус: ${data.status || 'Новый'}
        `;
        
        // Показываем информативное сообщение об успешном оформлении заказа
        showMessage(orderMessage);
        
        // Очищаем корзину
        localStorage.removeItem('cart');
        
        // Отправляем событие об обновлении корзины
        window.dispatchEvent(new CustomEvent('cart-updated'));
        
        // Возвращаемся на главную страницу
        setTimeout(() => {
            // Скрываем страницу оформления заказа
            const checkoutContainer = document.getElementById('checkout-container');
            if (checkoutContainer) {
                checkoutContainer.style.display = 'none';
            }
            
            // Показываем главную страницу
            const homeContainer = document.getElementById('home-container');
            if (homeContainer) {
                homeContainer.style.display = 'block';
            }
            
            // Показываем нижнюю навигацию и активируем кнопку главной
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'flex';
                const homeBtn = document.querySelector('.nav-button[data-tab="home"]');
                if (homeBtn) {
                    homeBtn.click();
                }
            }
        }, 3000); // Увеличиваем задержку, чтобы пользователь успел прочитать сообщение
    })
    .catch(error => {
        showError(error.message);
        // Восстанавливаем кнопку
        if (completeOrderBtn) {
            completeOrderBtn.disabled = false;
            completeOrderBtn.textContent = 'Оформить заказ';
        }
    });
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

// Показать сообщение об успехе
function showMessage(message) {
    // Создаем новый элемент для всплывающего сообщения
    const messageContainer = document.createElement('div');
    messageContainer.className = 'toast-message';
    
    // Обрабатываем многострочные сообщения
    const lines = message.trim().split('\n');
    
    // Создаем заголовок с галочкой
    const header = document.createElement('div');
    header.className = 'toast-header';
    
    // Добавляем зеленую галочку
    const checkIcon = document.createElement('span');
    checkIcon.className = 'toast-check-icon';
    checkIcon.textContent = '✓';
    header.appendChild(checkIcon);
    
    // Добавляем основной заголовок (первая строка сообщения)
    const title = document.createElement('span');
    title.className = 'toast-title';
    title.textContent = lines[0] || 'Успешно!';
    header.appendChild(title);
    
    // Добавляем заголовок в контейнер
    messageContainer.appendChild(header);
    
    // Добавляем детали заказа, если есть дополнительные строки
    if (lines.length > 1) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'toast-details';
        
        // Добавляем каждую строку как отдельный элемент
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const detail = document.createElement('div');
                detail.className = 'toast-detail-line';
                detail.textContent = lines[i].trim();
                detailsContainer.appendChild(detail);
            }
        }
        
        messageContainer.appendChild(detailsContainer);
    }
    
    // Устанавливаем стили для многострочного сообщения
    messageContainer.style.maxWidth = '300px';
    messageContainer.style.textAlign = 'left';
    
    // Добавляем элемент в body
    document.body.appendChild(messageContainer);
    
    // Показываем сообщение с анимацией
    setTimeout(() => {
        messageContainer.classList.add('show');
    }, 10);
    
    // Скрываем и удаляем сообщение через некоторое время
    setTimeout(() => {
        messageContainer.classList.remove('show');
        messageContainer.classList.add('hide');
        
        // Удаляем элемент после завершения анимации
        setTimeout(() => {
            if (messageContainer.parentNode) {
                messageContainer.parentNode.removeChild(messageContainer);
            }
        }, 300);
    }, 4000); // Увеличиваем время показа для многострочных сообщений
    
    // Для обратной совместимости
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем страницу оформления заказа при необходимости
    const checkoutContainer = document.getElementById('checkout-container');
    if (checkoutContainer && checkoutContainer.style.display !== 'none') {
        initCheckout();
    }
}); 