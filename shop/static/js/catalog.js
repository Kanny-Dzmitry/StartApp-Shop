// Catalog management functions

// Глобальные переменные для хранения данных каталога
let categories = [];
let currentCategory = null;
let currentSection = null;
let currentProducts = [];
let searchTimeout = null; // Таймаут для задержки поиска при вводе

// Инициализация каталога
function initCatalog() {
    // Определяем тему Telegram
    applyTelegramTheme();
    
    // Загрузка категорий при открытии вкладки каталога
    loadCategories();

    // Добавляем обработчик событий для возврата к предыдущему экрану
    document.getElementById('back-to-categories').addEventListener('click', showCategories);
    document.getElementById('back-to-sections').addEventListener('click', () => {
        if (currentCategory) {
            loadSections(currentCategory.slug);
        } else {
            showCategories();
        }
    });
    
    // Добавляем обработчик событий для подсветки товаров в корзине
    window.addEventListener('cart-updated', highlightProductsInCart);
    
    // Инициализируем поисковую строку
    initProductSearch();
}

// Инициализация поиска товаров
function initProductSearch() {
    // Проверяем, существует ли уже поисковая строка
    let searchContainer = document.getElementById('search-container');
    
    // Если поисковой строки нет, создаем её
    if (!searchContainer) {
        // Создаем контейнер для поиска
        searchContainer = document.createElement('div');
        searchContainer.id = 'search-container';
        searchContainer.className = 'search-container';
        
        // Создаем форму поиска
        const searchForm = document.createElement('form');
        searchForm.className = 'search-form';
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Предотвращаем отправку формы
            const query = searchInput.value.trim();
            if (query) {
                searchProducts(query);
            }
        });
        
        // Создаем поле ввода
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Поиск товаров...';
        searchInput.autocomplete = 'off';
        
        // Добавляем обработчик ввода для автодополнения
        searchInput.addEventListener('input', () => {
            const query = searchInput.value;
            
            // Очищаем предыдущий таймаут
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Показываем или скрываем кнопку очистки
            updateClearButtonVisibility(query);
            
            // Если поле пустое, скрываем результаты
            if (!query.trim()) {
                hideSearchSuggestions();
                return;
            }
            
            // Устанавливаем задержку перед запросом для уменьшения нагрузки
            searchTimeout = setTimeout(() => {
                fetchSearchSuggestions(query);
            }, 300);
        });
        
        // Добавляем обработчик для клавиши Escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Если есть подсказки и они видимы, скрываем их
                const suggestionsContainer = document.getElementById('search-suggestions');
                if (suggestionsContainer && suggestionsContainer.style.display === 'block') {
                    hideSearchSuggestions();
                } else {
                    // Иначе очищаем поле ввода
                    searchInput.value = '';
                    updateClearButtonVisibility('');
                    hideSearchSuggestions();
                }
            }
        });
        
        // Создаем кнопку очистки поискового поля
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.id = 'clear-search-button';
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
            hideSearchSuggestions();
            
            // Возвращаемся в каталог, если находимся в результатах поиска
            const searchTitleContainer = document.querySelector('.search-title-container');
            if (searchTitleContainer) {
                // Если был выбран раздел, возвращаемся к нему
                if (currentSection) {
                    loadProducts(currentCategory.slug, currentSection.slug);
                }
                // Если была выбрана категория, возвращаемся к ней
                else if (currentCategory) {
                    loadSections(currentCategory.slug);
                }
                // Иначе возвращаемся к списку категорий
                else {
                    showCategories();
                }
            }
            
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
        suggestionsContainer.id = 'search-suggestions';
        suggestionsContainer.className = 'search-suggestions';
        
        // Собираем форму поиска
        searchForm.appendChild(searchInput);
        searchForm.appendChild(clearButton);
        searchForm.appendChild(searchButton);
        
        // Добавляем форму и контейнер для результатов в основной контейнер
        searchContainer.appendChild(searchForm);
        searchContainer.appendChild(suggestionsContainer);
        
        // Вставляем поисковую строку перед контентом каталога
        const catalogContent = document.getElementById('catalog-content');
        const catalogContainer = document.getElementById('catalog-container');
        if (catalogContainer && catalogContent) {
            catalogContainer.insertBefore(searchContainer, catalogContent);
        }
        
        // Добавляем обработчик клика по документу для скрытия подсказок
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                hideSearchSuggestions();
            }
        });
    }
}

// Обновление видимости кнопки очистки
function updateClearButtonVisibility(query) {
    const clearButton = document.getElementById('clear-search-button');
    if (clearButton) {
        clearButton.style.display = query ? 'block' : 'none';
    }
}

// Получение подсказок для автодополнения
function fetchSearchSuggestions(query) {
    // Нормализуем запрос (удаляем лишние пробелы)
    const normalizedQuery = query.trim();
    
    // Если запрос пустой после нормализации, не выполняем поиск
    if (!normalizedQuery) {
        hideSearchSuggestions();
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
            showSearchSuggestions(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Отображение подсказок автодополнения
function showSearchSuggestions(products) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) return;
    
    // Очищаем контейнер
    suggestionsContainer.innerHTML = '';
    
    // Если нет результатов, скрываем контейнер
    if (!products || products.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    // Добавляем каждый товар в список подсказок
    products.forEach(product => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Если есть изображение, добавляем его
        if (product.image) {
            const productImage = document.createElement('div');
            productImage.className = 'suggestion-image';
            productImage.style.backgroundImage = `url(${product.image})`;
            suggestionItem.appendChild(productImage);
        }
        
        // Добавляем название товара
        const productName = document.createElement('div');
        productName.className = 'suggestion-name';
        productName.textContent = product.name;
        suggestionItem.appendChild(productName);
        
        // Добавляем цену товара
        const productPrice = document.createElement('div');
        productPrice.className = 'suggestion-price';
        productPrice.textContent = `${product.price} ₽`;
        suggestionItem.appendChild(productPrice);
        
        // Добавляем обработчик клика
        suggestionItem.addEventListener('click', () => {
            // Устанавливаем значение в поле поиска
            document.getElementById('search-input').value = product.name;
            
            // Скрываем подсказки
            hideSearchSuggestions();
            
            // Выполняем поиск с выбранным товаром
            searchProducts(product.name, product.id);
        });
        
        // Добавляем элемент в контейнер
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    // Показываем контейнер с подсказками
    suggestionsContainer.style.display = 'block';
}

// Скрытие подсказок автодополнения
function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Поиск товаров по запросу
function searchProducts(query, productId = null) {
    // Нормализуем запрос
    const normalizedQuery = query.trim();
    
    // Если запрос пустой после нормализации, не выполняем поиск
    if (!normalizedQuery) {
        return;
    }
    
    // Показываем индикатор загрузки
    showLoading('catalog-content');
    
    // Кодируем запрос для URL
    const encodedQuery = encodeURIComponent(normalizedQuery);
    
    // Если указан ID товара, ищем только его
    if (productId) {
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
                showSearchResults(normalizedQuery, filteredProducts);
                hideLoading('catalog-content');
            })
            .catch(error => {
                console.error('Error:', error);
                showError("Не удалось выполнить поиск товаров");
                hideLoading('catalog-content');
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
                showSearchResults(normalizedQuery, data);
                hideLoading('catalog-content');
            })
            .catch(error => {
                console.error('Error:', error);
                showError("Не удалось выполнить поиск товаров");
                hideLoading('catalog-content');
            });
    }
}

// Отображение результатов поиска
function showSearchResults(query, products) {
    // Получаем контейнер для контента
    const catalogContent = document.getElementById('catalog-content');
    
    // Показываем кнопку назад к категориям
    document.getElementById('catalog-navigation').style.display = 'block';
    document.getElementById('back-to-categories').style.display = 'block';
    document.getElementById('back-to-sections').style.display = 'none';
    
    // Очищаем контейнер
    catalogContent.innerHTML = '';
    
    // Заголовок с результатами поиска
    const searchTitle = document.createElement('h2');
    searchTitle.className = 'catalog-title';
    
    // Ограничиваем длину запроса для отображения
    const displayQuery = query.length > 20 ? query.substring(0, 20) + '...' : query;
    searchTitle.textContent = `Результаты поиска`;
    
    // Добавляем подзаголовок с запросом
    const searchSubtitle = document.createElement('div');
    searchSubtitle.className = 'search-subtitle';
    searchSubtitle.textContent = `«${displayQuery}»`;
    
    // Создаем контейнер для заголовка и подзаголовка
    const titleContainer = document.createElement('div');
    titleContainer.className = 'search-title-container';
    titleContainer.appendChild(searchTitle);
    titleContainer.appendChild(searchSubtitle);
    
    catalogContent.appendChild(titleContainer);
    
    // Создаем контейнер для списка товаров
    const productsList = document.createElement('div');
    productsList.className = 'products-list';
    
    // Добавляем товары в список
    if (products.length === 0) {
        const noProducts = document.createElement('p');
        noProducts.className = 'no-items';
        noProducts.textContent = 'По вашему запросу ничего не найдено';
        catalogContent.appendChild(noProducts);
    } else {
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsList.appendChild(productCard);
        });
    }
    
    // Добавляем список в контейнер
    catalogContent.appendChild(productsList);
    
    // Подсвечиваем товары, которые уже в корзине
    if (typeof cart !== 'undefined' && cart) {
        highlightProductsInCart();
    } else if (typeof loadCart === 'function') {
        // Если корзина еще не загружена, но функция loadCart доступна
        loadCart().then(() => {
            highlightProductsInCart();
        }).catch(() => {
            console.log('Не удалось загрузить корзину');
        });
    }
}

// Определение и применение темы Telegram
function applyTelegramTheme() {
    if (window.Telegram && window.Telegram.WebApp) {
        const colorScheme = window.Telegram.WebApp.colorScheme;
        document.body.classList.add(`theme-${colorScheme}`);
        
        console.log(`Применена тема Telegram: ${colorScheme}`);
        
        // Добавляем слушатель для изменения темы
        window.Telegram.WebApp.onEvent('themeChanged', () => {
            // Удаляем предыдущие классы тем
            document.body.classList.remove('theme-dark', 'theme-light');
            
            // Добавляем актуальный класс темы
            const newColorScheme = window.Telegram.WebApp.colorScheme;
            document.body.classList.add(`theme-${newColorScheme}`);
            
            console.log(`Тема Telegram изменена на: ${newColorScheme}`);
        });
    }
}

// Загрузка списка категорий
function loadCategories() {
    // Показываем индикатор загрузки
    showLoading('catalog-content');
    
    fetch('/api/catalog/categories/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении категорий');
            }
            return response.json();
        })
        .then(data => {
            categories = data;
            showCategories();
        })
        .catch(error => {
            console.error('Error:', error);
            showError("Не удалось загрузить категории");
            hideLoading('catalog-content');
        });
}

// Отображение списка категорий
function showCategories() {
    // Сбрасываем текущие выбранные элементы
    currentCategory = null;
    currentSection = null;
    currentProducts = [];
    
    // Получаем контейнер для контента
    const catalogContent = document.getElementById('catalog-content');
    
    // Скрываем кнопки навигации
    document.getElementById('catalog-navigation').style.display = 'none';
    
    // Очищаем контейнер
    catalogContent.innerHTML = '';
    
    // Заголовок каталога
    const catalogTitle = document.createElement('h2');
    catalogTitle.className = 'catalog-title';
    catalogTitle.textContent = 'Категории товаров';
    catalogContent.appendChild(catalogTitle);
    
    // Создаем контейнер для сетки категорий
    const categoriesGrid = document.createElement('div');
    categoriesGrid.className = 'categories-grid';
    
    // Добавляем категории в сетку
    if (categories.length === 0) {
        const noCategories = document.createElement('p');
        noCategories.className = 'no-items';
        noCategories.textContent = 'Категории не найдены';
        catalogContent.appendChild(noCategories);
    } else {
        categories.forEach(category => {
            const categoryCard = createCategoryCard(category);
            categoriesGrid.appendChild(categoryCard);
        });
    }
    
    // Добавляем сетку в контейнер
    catalogContent.appendChild(categoriesGrid);
    
    // Скрываем индикатор загрузки
    hideLoading('catalog-content');
}

// Создание карточки категории
function createCategoryCard(category) {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.setAttribute('data-slug', category.slug);
    
    // Добавляем название категории
    const categoryName = document.createElement('div');
    categoryName.className = 'category-name';
    categoryName.textContent = category.name;
    categoryCard.appendChild(categoryName);
    
    // Добавляем изображение категории
    if (category.image) {
        categoryCard.style.backgroundImage = `url(${category.image})`;
    } else {
        // Если изображения нет, добавляем заглушку
        categoryCard.classList.add('no-image');
    }
    
    // Добавляем обработчик события клика
    categoryCard.addEventListener('click', () => {
        loadSections(category.slug);
    });
    
    return categoryCard;
}

// Загрузка разделов выбранной категории
function loadSections(categorySlug) {
    // Показываем индикатор загрузки
    showLoading('catalog-content');
    
    // Находим выбранную категорию
    currentCategory = categories.find(cat => cat.slug === categorySlug);
    
    fetch(`/api/catalog/categories/${categorySlug}/sections/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении разделов');
            }
            return response.json();
        })
        .then(data => {
            const sections = data;
            showSections(sections);
            hideLoading('catalog-content');
        })
        .catch(error => {
            console.error('Error:', error);
            showError("Не удалось загрузить разделы категории");
            hideLoading('catalog-content');
        });
}

// Отображение разделов категории
function showSections(sections) {
    // Получаем контейнер для контента
    const catalogContent = document.getElementById('catalog-content');
    
    // Показываем кнопку назад к категориям
    document.getElementById('catalog-navigation').style.display = 'block';
    document.getElementById('back-to-categories').style.display = 'block';
    document.getElementById('back-to-sections').style.display = 'none';
    
    // Очищаем контейнер
    catalogContent.innerHTML = '';
    
    // Заголовок с названием категории
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'catalog-title';
    categoryTitle.textContent = currentCategory ? currentCategory.name : 'Разделы';
    catalogContent.appendChild(categoryTitle);
    
    // Создаем контейнер для сетки разделов
    const sectionsGrid = document.createElement('div');
    sectionsGrid.className = 'sections-grid';
    
    // Добавляем разделы в сетку
    if (sections.length === 0) {
        const noSections = document.createElement('p');
        noSections.className = 'no-items';
        noSections.textContent = 'В данной категории нет разделов';
        catalogContent.appendChild(noSections);
    } else {
        sections.forEach(section => {
            const sectionCard = createSectionCard(section);
            sectionsGrid.appendChild(sectionCard);
        });
    }
    
    // Добавляем сетку в контейнер
    catalogContent.appendChild(sectionsGrid);
    
    // Скрываем индикатор загрузки
    hideLoading('catalog-content');
}

// Создание карточки раздела
function createSectionCard(section) {
    const sectionCard = document.createElement('div');
    sectionCard.className = 'section-card';
    sectionCard.setAttribute('data-slug', section.slug);
    
    // Добавляем название раздела
    const sectionName = document.createElement('div');
    sectionName.className = 'section-name';
    sectionName.textContent = section.name;
    sectionCard.appendChild(sectionName);
    
    // Добавляем изображение раздела
    if (section.image) {
        sectionCard.style.backgroundImage = `url(${section.image})`;
    } else {
        // Если изображения нет, добавляем заглушку
        sectionCard.classList.add('no-image');
    }
    
    // Добавляем обработчик события клика
    sectionCard.addEventListener('click', () => {
        loadProducts(currentCategory.slug, section.slug);
    });
    
    return sectionCard;
}

// Загрузка товаров выбранного раздела
function loadProducts(categorySlug, sectionSlug) {
    // Показываем индикатор загрузки
    showLoading('catalog-content');
    
    // Получаем выбранный раздел через API
    fetch(`/api/catalog/categories/${categorySlug}/sections/${sectionSlug}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении данных раздела');
            }
            return response.json();
        })
        .then(data => {
            currentSection = data;
            
            // Загружаем товары раздела
            return fetch(`/api/catalog/categories/${categorySlug}/sections/${sectionSlug}/products/`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении товаров');
            }
            return response.json();
        })
        .then(data => {
            currentProducts = data;
            showProducts();
            hideLoading('catalog-content');
            
            // После отображения товаров обновляем их карточки с учетом товаров в корзине
            if (typeof updateProductCardsInCatalog === 'function') {
                updateProductCardsInCatalog();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError("Не удалось загрузить данные раздела или товары");
            hideLoading('catalog-content');
        });
}

// Отображение товаров раздела
function showProducts() {
    // Получаем контейнер для контента
    const catalogContent = document.getElementById('catalog-content');
    
    // Показываем кнопки навигации
    document.getElementById('catalog-navigation').style.display = 'block';
    document.getElementById('back-to-categories').style.display = 'none';
    document.getElementById('back-to-sections').style.display = 'block';
    
    // Очищаем контейнер
    catalogContent.innerHTML = '';
    
    // Заголовок с названием раздела
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'catalog-title';
    sectionTitle.textContent = currentSection ? currentSection.name : 'Товары';
    catalogContent.appendChild(sectionTitle);
    
    // Создаем контейнер для списка товаров
    const productsList = document.createElement('div');
    productsList.className = 'products-list';
    
    // Добавляем товары в список
    if (currentProducts.length === 0) {
        const noProducts = document.createElement('p');
        noProducts.className = 'no-items';
        noProducts.textContent = 'В данном разделе нет товаров';
        catalogContent.appendChild(noProducts);
    } else {
        currentProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsList.appendChild(productCard);
        });
    }
    
    // Добавляем список в контейнер
    catalogContent.appendChild(productsList);
    
    // Скрываем индикатор загрузки
    hideLoading('catalog-content');
    
    // Подсвечиваем товары, которые уже в корзине
    if (typeof cart !== 'undefined' && cart) {
        highlightProductsInCart();
    } else if (typeof loadCart === 'function') {
        // Если корзина еще не загружена, но функция loadCart доступна
        loadCart().then(() => {
            highlightProductsInCart();
        });
    }
}

// Создание карточки товара
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-id', product.id);
    
    // Добавляем изображение товара
    const productImage = document.createElement('div');
    productImage.className = 'product-image';
    if (product.image) {
        productImage.style.backgroundImage = `url(${product.image})`;
    } else {
        productImage.classList.add('no-image');
    }
    productCard.appendChild(productImage);
    
    // Добавляем информацию о товаре
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    // Название товара
    const productName = document.createElement('h3');
    productName.className = 'product-name';
    productName.textContent = product.name;
    productInfo.appendChild(productName);
    
    // Блок с ценой и количеством
    const priceQuantityBlock = document.createElement('div');
    priceQuantityBlock.className = 'product-price-quantity';
    
    // Цена товара
    const productPrice = document.createElement('div');
    productPrice.className = 'product-price';
    productPrice.textContent = `${product.price} ₽`;
    priceQuantityBlock.appendChild(productPrice);
    
    // Количество товара
    const productQuantity = document.createElement('div');
    productQuantity.className = 'product-quantity';
    productQuantity.textContent = `${product.quantity_value} ${product.quantity_type}`;
    priceQuantityBlock.appendChild(productQuantity);
    
    // Добавляем блок с ценой и количеством в информацию о товаре
    productInfo.appendChild(priceQuantityBlock);
    
    // Добавляем описание товара, если оно есть
    if (product.description) {
        // Контейнер для описания
        const productDescription = document.createElement('div');
        productDescription.className = 'product-description collapsed';
        productDescription.textContent = product.description;
        productInfo.appendChild(productDescription);
        
        // Кнопка "Показать больше"
        const showMoreBtn = document.createElement('button');
        showMoreBtn.className = 'show-more-btn';
        showMoreBtn.textContent = 'Показать больше';
        showMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплытие события
            toggleDescription(productDescription, showMoreBtn);
        });
        productInfo.appendChild(showMoreBtn);
    }
    
    productCard.appendChild(productInfo);
    
    // Добавляем кнопку "В корзину"
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'btn btn-small add-to-cart-btn';
    addToCartBtn.textContent = 'В корзину';
    addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        addToCart(product.id);
    });
    productCard.appendChild(addToCartBtn);
    
    // Добавляем обработчик события клика на карточку для просмотра деталей товара
    productCard.addEventListener('click', () => {
        showProductDetails(product);
    });
    
    return productCard;
}

// Добавление товара в корзину
function addToCart(productId) {
    // Если функция добавления товара в корзину доступна из cart.js, используем её
    if (typeof addProductToCart === 'function') {
        addProductToCart(productId);
    } else {
        // Запасной вариант, если cart.js не загружен
        console.log(`Добавление товара ${productId} в корзину`);
        // Добавляем подсветку карточки товара
        highlightProductCard(productId);
    }
}

// Подсветка карточки товара при добавлении в корзину
function highlightProductCard(productId) {
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!productCard) return;
    
    // Добавляем класс для подсветки
    productCard.classList.add('product-added');
    
    // Убираем класс через 1.5 секунды
    setTimeout(() => {
        productCard.classList.remove('product-added');
    }, 1500);
}

// Подсветка товаров, находящихся в корзине
function highlightProductsInCart() {
    // Проверяем доступность корзины
    if (typeof cart === 'undefined' || !cart) {
        // Пытаемся получить корзину из localStorage
        try {
            const cartData = localStorage.getItem('cart');
            if (cartData) {
                cart = { items: JSON.parse(cartData) };
            }
        } catch (e) {
            console.error('Ошибка при получении корзины из localStorage:', e);
            return;
        }
        
        // Если корзину не удалось получить, выходим
        if (!cart || !cart.items) {
            return;
        }
    }
    
    // Получаем все карточки товаров на странице
    const productCards = document.querySelectorAll('.product-card');
    
    // Перебираем все карточки и проверяем, есть ли товар в корзине
    productCards.forEach(card => {
        const productId = parseInt(card.getAttribute('data-id'));
        if (!productId) return;
        
        // Проверяем, есть ли товар в корзине
        const inCart = cart.items.some(item => {
            // Проверяем как объекты, так и простые ID
            if (typeof item === 'object' && item.product) {
                return item.product.id === productId || item.product === productId;
            } else {
                return item.id === productId || item === productId;
            }
        });
        
        // Находим кнопку "В корзину" в карточке товара
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        // Добавляем или убираем класс подсветки
        if (inCart) {
            card.classList.add('product-in-cart');
            if (addToCartBtn) {
                addToCartBtn.textContent = 'В корзине';
                addToCartBtn.classList.add('in-cart');
            }
        } else {
            card.classList.remove('product-in-cart');
            if (addToCartBtn) {
                addToCartBtn.textContent = 'В корзину';
                addToCartBtn.classList.remove('in-cart');
            }
        }
    });
}

// Отображение детальной информации о товаре
function showProductDetails(product) {
    // Здесь будет логика отображения детальной информации о товаре
    console.log(`Просмотр информации о товаре ${product.id}`);
}

// Переключение между кратким и полным описанием товара
function toggleDescription(descriptionElement, buttonElement) {
    if (descriptionElement.classList.contains('collapsed')) {
        // Раскрываем описание
        descriptionElement.classList.remove('collapsed');
        descriptionElement.classList.add('expanded');
        buttonElement.textContent = 'Скрыть';
    } else {
        // Сворачиваем описание
        descriptionElement.classList.remove('expanded');
        descriptionElement.classList.add('collapsed');
        buttonElement.textContent = 'Показать больше';
    }
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
    // Инициализируем каталог при переключении на вкладку каталога
    const catalogTab = document.querySelector('.nav-button[data-tab="catalog"]');
    if (catalogTab) {
        catalogTab.addEventListener('click', () => {
            if (categories.length === 0) {
                initCatalog();
            }
        });
    }
}); 