// Catalog management functions

// Глобальные переменные для хранения данных каталога
let categories = [];
let currentCategory = null;
let currentSection = null;
let currentProducts = [];

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
    if (typeof cart === 'undefined' || !cart || !cart.items) return;
    
    // Получаем все карточки товаров на странице
    const productCards = document.querySelectorAll('.product-card');
    
    // Перебираем все карточки и проверяем, есть ли товар в корзине
    productCards.forEach(card => {
        const productId = parseInt(card.getAttribute('data-id'));
        if (!productId) return;
        
        // Проверяем, есть ли товар в корзине
        const inCart = cart.items.some(item => item.product.id === productId);
        
        // Добавляем или убираем класс подсветки
        if (inCart) {
            card.classList.add('product-in-cart');
        } else {
            card.classList.remove('product-in-cart');
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