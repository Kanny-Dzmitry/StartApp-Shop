// Функции для главной страницы

// Инициализация главной страницы
function initHome() {
    // Определяем тему Telegram
    applyTelegramTheme();
    
    // Добавляем ID пользователя в URL для серверной проверки голосования
    addUserIdToUrl();
    
    // Сначала инициализируем поисковую строку
    initHomeSearch();
    
    // Затем инициализируем слайдер новостей
    initNewsSlider();
    
    // Инициализируем компонент оценки
    initRatingPoll();
}

// Добавление ID пользователя в URL для серверной проверки голосования
function addUserIdToUrl() {
    // Получаем данные пользователя из Telegram WebApp
    let userId = '';
    
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        userId = user.id || '';
    }
    
    // Если не удалось получить ID пользователя, пытаемся использовать сохраненный ID
    if (!userId) {
        // Генерируем случайный ID, если нет сохраненного
        if (!localStorage.getItem('guest_user_id')) {
            localStorage.setItem('guest_user_id', 'guest_' + Math.random().toString(36).substring(2, 15));
        }
        userId = localStorage.getItem('guest_user_id');
    }
    
    // Если у нас есть ID пользователя, добавляем его в URL
    if (userId) {
        // Получаем текущий URL
        const url = new URL(window.location.href);
        
        // Добавляем или обновляем параметр user_id
        url.searchParams.set('user_id', userId);
        
        // Обновляем URL без перезагрузки страницы
        window.history.replaceState({}, '', url);
    }
}

// Инициализация слайдера новостей
function initNewsSlider() {
    const slider = document.querySelector('.news-slider-container');
    const dots = document.querySelectorAll('.news-slider-dot');
    
    if (!slider || !dots.length) return;
    
    let currentSlide = 0;
    const slideCount = dots.length;
    
    // Определяем, является ли устройство мобильным
    const isMobile = window.innerWidth <= 480;
    
    // Функция для перехода к определенному слайду
    function goToSlide(slideIndex) {
        if (slideIndex < 0) slideIndex = slideCount - 1;
        if (slideIndex >= slideCount) slideIndex = 0;
        
        currentSlide = slideIndex;
        
        // Обновляем положение слайдера с учетом типа устройства
        if (isMobile) {
            slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        } else {
            slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        
        // Обновляем активную точку
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Добавляем обработчики событий для точек
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Автоматическое переключение слайдов
    let slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
    
    // Останавливаем автоматическое переключение при взаимодействии
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
    });
    
    // Инициализация свайпов для мобильных устройств
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(slideInterval);
    }, {passive: true});
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        
        slideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
    }, {passive: true});
    
    function handleSwipe() {
        const difference = touchStartX - touchEndX;
        if (difference > 30) { // Уменьшил порог для более отзывчивого свайпа на мобильных
            // Свайп влево - следующий слайд
            goToSlide(currentSlide + 1);
        } else if (difference < -30) { // Уменьшил порог для более отзывчивого свайпа на мобильных
            // Свайп вправо - предыдущий слайд
            goToSlide(currentSlide - 1);
        }
    }
    
    // Обработчик изменения размера окна для адаптивности
    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 480;
        if (newIsMobile !== isMobile) {
            // Перезагружаем страницу при изменении типа устройства
            location.reload();
        }
    });
    
    // Инициализируем первый слайд
    goToSlide(0);
}

// Инициализация поиска товаров на главной странице
function initHomeSearch() {
    // Проверяем, существует ли уже поисковая строка
    let searchContainer = document.getElementById('home-search-container');
    if (searchContainer) return; // Если уже существует, не создаем повторно
    
    // Создаем контейнер для поиска
    searchContainer = document.createElement('div');
    searchContainer.id = 'home-search-container';
    searchContainer.className = 'search-container home-search-container';
    
    // Создаем форму поиска
    const searchForm = document.createElement('form');
    searchForm.className = 'search-form';
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Предотвращаем отправку формы
        const query = searchInput.value.trim();
        if (query) {
            searchProductsFromHome(query);
        }
    });
    
    // Создаем поле ввода
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'home-search-input';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Поиск товаров...';
    searchInput.autocomplete = 'off';
    
    // Добавляем обработчик ввода для автодополнения
    let searchTimeout = null;
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        
        // Очищаем предыдущий таймаут
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Показываем или скрываем кнопку очистки
        updateHomeClearButtonVisibility(query);
        
        // Если поле пустое, скрываем результаты
        if (!query.trim()) {
            hideHomeSearchSuggestions();
            return;
        }
        
        // Устанавливаем задержку перед запросом для уменьшения нагрузки
        searchTimeout = setTimeout(() => {
            fetchHomeSearchSuggestions(query);
        }, 300);
    });
    
    // Добавляем обработчик для клавиши Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Если есть подсказки и они видимы, скрываем их
            const suggestionsContainer = document.getElementById('home-search-suggestions');
            if (suggestionsContainer && suggestionsContainer.style.display === 'block') {
                hideHomeSearchSuggestions();
            } else {
                // Иначе очищаем поле ввода
                searchInput.value = '';
                updateHomeClearButtonVisibility('');
                hideHomeSearchSuggestions();
            }
        }
    });
    
    // Создаем кнопку очистки поискового поля
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.id = 'home-clear-search-button';
    clearButton.className = 'clear-search-button';
    clearButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    clearButton.style.display = 'none'; // По умолчанию скрыта
    
    // Добавляем обработчик для кнопки очистки
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        hideHomeSearchSuggestions();
        searchInput.focus();
    });
    
    // Создаем кнопку поиска
    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.className = 'search-button';
    searchButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    
    // Создаем контейнер для результатов автодополнения
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'home-search-suggestions';
    suggestionsContainer.className = 'search-suggestions';
    
    // Собираем форму поиска
    searchForm.appendChild(searchInput);
    searchForm.appendChild(clearButton);
    searchForm.appendChild(searchButton);
    
    // Добавляем форму и контейнер для результатов в основной контейнер
    searchContainer.appendChild(searchForm);
    searchContainer.appendChild(suggestionsContainer);
    
    // Вставляем поисковую строку в самое начало контейнера главной страницы
    const homeContainer = document.getElementById('home-container');
    if (homeContainer) {
        // Вставляем перед первым элементом
        homeContainer.insertBefore(searchContainer, homeContainer.firstChild);
        
        // Добавляем небольшую задержку, чтобы стили применились
        setTimeout(() => {
            searchContainer.style.opacity = '1';
        }, 100);
    }
    
    // Добавляем обработчик клика по документу для скрытия подсказок
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            hideHomeSearchSuggestions();
        }
    });
}

// Обновление видимости кнопки очистки
function updateHomeClearButtonVisibility(query) {
    const clearButton = document.getElementById('home-clear-search-button');
    if (clearButton) {
        clearButton.style.display = query ? 'flex' : 'none';
    }
}

// Получение подсказок для автодополнения
function fetchHomeSearchSuggestions(query) {
    // Нормализуем запрос (удаляем лишние пробелы)
    const normalizedQuery = query.trim();
    
    // Если запрос пустой после нормализации, не выполняем поиск
    if (!normalizedQuery) {
        hideHomeSearchSuggestions();
        return;
    }
    
    // Кодируем запрос для URL
    const encodedQuery = encodeURIComponent(normalizedQuery);
    
    fetch(`/api/catalog/search/products/?q=${encodedQuery}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении подсказок');
            }
            return response.json();
        })
        .then(data => {
            showHomeSearchSuggestions(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Отображение подсказок поиска
function showHomeSearchSuggestions(products) {
    const suggestionsContainer = document.getElementById('home-search-suggestions');
    if (!suggestionsContainer) return;
    
    // Очищаем контейнер
    suggestionsContainer.innerHTML = '';
    
    // Если нет результатов, показываем сообщение
    if (products.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-suggestions">Товары не найдены</div>';
        suggestionsContainer.style.display = 'block';
        return;
    }
    
    // Добавляем каждый товар в список подсказок
    products.forEach(product => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Добавляем изображение товара, если есть
        if (product.image) {
            const productImage = document.createElement('img');
            productImage.className = 'suggestion-image';
            productImage.src = product.image;
            productImage.alt = product.name;
            suggestionItem.appendChild(productImage);
        }
        
        // Добавляем информацию о товаре
        const productInfo = document.createElement('div');
        productInfo.className = 'suggestion-info';
        
        // Название товара
        const productName = document.createElement('div');
        productName.className = 'suggestion-name';
        productName.textContent = product.name;
        productInfo.appendChild(productName);
        
        // Цена товара
        const productPrice = document.createElement('div');
        productPrice.className = 'suggestion-price';
        productPrice.textContent = `${product.price} ₽`;
        productInfo.appendChild(productPrice);
        
        suggestionItem.appendChild(productInfo);
        
        // Добавляем обработчик клика для перехода к товару
        suggestionItem.addEventListener('click', () => {
            searchProductsFromHome(document.getElementById('home-search-input').value, product.id);
            hideHomeSearchSuggestions();
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    // Показываем контейнер с подсказками
    suggestionsContainer.style.display = 'block';
}

// Скрытие подсказок поиска
function hideHomeSearchSuggestions() {
    const suggestionsContainer = document.getElementById('home-search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Поиск товаров по запросу с главной страницы
function searchProductsFromHome(query, productId = null) {
    // Нормализуем запрос
    const normalizedQuery = query.trim();
    
    // Если запрос пустой после нормализации, не выполняем поиск
    if (!normalizedQuery) {
        return;
    }
    
    // Переключаемся на вкладку каталога
    const catalogTab = document.querySelector('.nav-button[data-tab="catalog"]');
    if (catalogTab) {
        catalogTab.click();
        
        // Ждем немного, чтобы каталог успел инициализироваться
        setTimeout(() => {
            // Показываем индикатор загрузки
            if (typeof showLoading === 'function') {
                showLoading('catalog-content');
            }
            
            // Кодируем запрос для URL
            const encodedQuery = encodeURIComponent(normalizedQuery);
            
            // Выполняем поиск
            if (productId) {
                // Если указан ID товара, ищем только его
                fetch(`/api/catalog/search/products/?q=${encodedQuery}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Ошибка при поиске товаров');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Фильтруем результаты по ID
                        const filteredProducts = data.filter(p => p.id === productId);
                        if (typeof showSearchResults === 'function') {
                            showSearchResults(normalizedQuery, filteredProducts);
                        }
                        if (typeof hideLoading === 'function') {
                            hideLoading('catalog-content');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        if (typeof showError === 'function') {
                            showError("Не удалось выполнить поиск товаров");
                        }
                        if (typeof hideLoading === 'function') {
                            hideLoading('catalog-content');
                        }
                    });
            } else {
                // Иначе ищем все товары по запросу
                fetch(`/api/catalog/search/products/?q=${encodedQuery}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Ошибка при поиске товаров');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (typeof showSearchResults === 'function') {
                            showSearchResults(normalizedQuery, data);
                        }
                        if (typeof hideLoading === 'function') {
                            hideLoading('catalog-content');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        if (typeof showError === 'function') {
                            showError("Не удалось выполнить поиск товаров");
                        }
                        if (typeof hideLoading === 'function') {
                            hideLoading('catalog-content');
                        }
                    });
            }
        }, 300);
    }
}

// Инициализация компонента оценки
function initRatingPoll() {
    const ratingPoll = document.getElementById('rating-poll');
    if (!ratingPoll) return; // Если нет опроса на странице, выходим
    
    // Получаем ID опроса
    const pollId = ratingPoll.getAttribute('data-poll-id');
    
    // Проверяем, голосовал ли пользователь в этом опросе
    const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
    
    // Добавляем кнопку для скрытия опроса
    const hideButton = document.createElement('button');
    hideButton.className = 'hide-poll-btn';
    hideButton.innerHTML = '✕';
    hideButton.title = 'Скрыть опрос';
    hideButton.style.position = 'absolute';
    hideButton.style.top = '6px';
    hideButton.style.right = '6px';
    hideButton.style.background = 'transparent';
    hideButton.style.border = 'none';
    hideButton.style.fontSize = '14px';
    hideButton.style.cursor = 'pointer';
    hideButton.style.color = 'var(--tg-theme-button-text-color, #ffffff)';
    hideButton.style.padding = '3px';
    hideButton.style.lineHeight = '1';
    hideButton.style.zIndex = '2';
    hideButton.style.opacity = '0.7';
    
    // Проверяем, скрыт ли опрос
    const hiddenPoll = localStorage.getItem(`hidden_poll_${pollId}`);
    if (hiddenPoll === 'true') {
        ratingPoll.style.display = 'none';
        return;
    }
    
    // Добавляем кнопку скрытия в контейнер опроса
    ratingPoll.style.position = 'relative';
    ratingPoll.appendChild(hideButton);
    
    // Обработчик для скрытия опроса
    hideButton.addEventListener('click', () => {
        // Сохраняем информацию о скрытии опроса
        localStorage.setItem(`hidden_poll_${pollId}`, 'true');
        
        // Скрываем опрос
        ratingPoll.style.display = 'none';
    });
    
    // Если пользователь уже голосовал, показываем результат
    if (votedPolls[pollId] || document.querySelector('.rating-result.visible')) {
        showRatingResult(pollId);
        return;
    }
    
    const stars = document.querySelectorAll('.rating-star');
    const commentContainer = document.querySelector('.rating-comment');
    const commentInput = document.getElementById('rating-comment');
    const submitButton = document.getElementById('rating-submit-btn');
    
    let selectedRating = 0;
    
    // Обработчик клика по звездам
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            selectedRating = value;
            
            // Анимация при выборе звезды
            star.classList.add('pulse');
            setTimeout(() => {
                star.classList.remove('pulse');
            }, 300);
            
            // Обновляем отображение звезд
            updateStars(value);
            
            // Показываем поле для комментария
            commentContainer.classList.add('visible');
            
            // Активируем кнопку отправки
            submitButton.disabled = false;
        });
    });
    
    // Функция для обновления отображения звезд
    function updateStars(value) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.textContent = '★'; // Заполненная звезда
                star.classList.add('active');
            } else {
                star.textContent = '☆'; // Пустая звезда
                star.classList.remove('active');
            }
        });
    }
    
    // Обработчик отправки оценки
    submitButton.addEventListener('click', async () => {
        if (selectedRating === 0) return;
        
        // Получаем данные пользователя из Telegram WebApp
        let userId = '';
        let userName = '';
        
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            userId = user.id || '';
            userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        
        // Если не удалось получить ID пользователя, генерируем случайный
        if (!userId) {
            userId = 'guest_' + Math.random().toString(36).substring(2, 15);
        }
        
        // Отключаем кнопку на время отправки
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';
        
        try {
            // Отправляем оценку на сервер
            const response = await fetch('/api/rating/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poll_id: pollId,
                    user_id: userId,
                    user_name: userName,
                    rating: selectedRating,
                    comment: commentInput.value.trim()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Сохраняем информацию о голосовании
                const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
                votedPolls[pollId] = {
                    rating: selectedRating,
                    timestamp: Date.now()
                };
                localStorage.setItem('voted_polls', JSON.stringify(votedPolls));
                
                // Показываем результат
                showRatingResult(pollId, data.average_rating, data.ratings_count);
                
                // Показываем сообщение об успехе
                showSuccessMessage(data.message);
            } else {
                throw new Error(data.error || 'Произошла ошибка при отправке оценки');
            }
        } catch (error) {
            console.error('Ошибка при отправке оценки:', error);
            showErrorMessage(error.message || 'Не удалось отправить оценку. Пожалуйста, попробуйте позже.');
            
            // Возвращаем кнопку в исходное состояние
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить';
        }
    });
}

// Функция для отображения результата голосования
function showRatingResult(pollId, avgRating, ratingsCount) {
    // Скрываем форму оценки
    const starsContainer = document.querySelector('.rating-stars');
    const commentContainer = document.querySelector('.rating-comment');
    const submitButton = document.getElementById('rating-submit-btn');
    const resultContainer = document.querySelector('.rating-result');
    const resultStars = document.querySelector('.rating-result-stars');
    const resultText = document.querySelector('.rating-result-text');
    const resultCount = document.querySelector('.rating-result-count');
    
    // Если у нас нет данных о среднем рейтинге, пытаемся получить их из DOM
    if (!avgRating) {
        const resultTextContent = resultText.textContent;
        const match = resultTextContent.match(/(\d+(\.\d+)?)/);
        if (match) {
            avgRating = parseFloat(match[1]);
        } else {
            avgRating = 0;
        }
    }
    
    // Если у нас нет данных о количестве оценок, пытаемся получить их из DOM
    if (!ratingsCount) {
        const resultCountContent = resultCount.textContent;
        const match = resultCountContent.match(/(\d+)/);
        if (match) {
            ratingsCount = parseInt(match[1]);
        } else {
            ratingsCount = 0;
        }
    }
    
    if (starsContainer) starsContainer.style.display = 'none';
    if (commentContainer) commentContainer.style.display = 'none';
    if (submitButton) submitButton.style.display = 'none';
    
    if (resultContainer && resultStars) {
        // Формируем отображение звезд
        const starsHTML = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
        
        resultStars.innerHTML = starsHTML;
        
        // Обновляем скрытые данные для полноты
        if (resultText) resultText.textContent = `Средняя оценка: ${avgRating ? avgRating.toFixed(1) : '0.0'} из 5`;
        if (resultCount) resultCount.textContent = `Всего оценок: ${ratingsCount || 0}`;
        
        resultContainer.classList.add('visible');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем главную страницу
    initHome();
}); 