// Profile management functions

// Get the authentication token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Check if the user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Fetch profile information
function updateProfileInfo() {
    const token = getAuthToken();
    
    if (!token) {
        showProfileNotAuthenticated();
        return;
    }
    
    fetch('/api/accounts/profiles/me/', {
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении данных профиля');
        }
        return response.json();
    })
    .then(profileData => {
        displayProfileData(profileData);
        loadUserAddresses();
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось загрузить данные профиля");
    });
}

// Display profile data
function displayProfileData(profileData) {
    // Get profile container
    const profileContainer = document.getElementById('profile-container');
    if (!profileContainer) return;
    
    // Show profile section
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    // Fill in profile data
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        // Clear previous content
        userInfo.innerHTML = '';
        
        // Create user info elements
        const firstName = document.createElement('p');
        firstName.innerHTML = `<strong>Имя:</strong> ${profileData.first_name || 'Не указано'}`;
        userInfo.appendChild(firstName);
        
        const lastName = document.createElement('p');
        lastName.innerHTML = `<strong>Фамилия:</strong> ${profileData.last_name || 'Не указана'}`;
        userInfo.appendChild(lastName);
        
        const phone = document.createElement('p');
        phone.innerHTML = `<strong>Телефон:</strong> ${profileData.phone_number || 'Не указан'}`;
        userInfo.appendChild(phone);
    }
    
    // Fill in edit form with current values
    const editForm = document.getElementById('profile-edit-form');
    if (editForm) {
        editForm.querySelector('#first-name').value = profileData.first_name || '';
        editForm.querySelector('#last-name').value = profileData.last_name || '';
        editForm.querySelector('#phone-number').value = profileData.phone_number || '';
    }
}

// Load user addresses
function loadUserAddresses() {
    const token = getAuthToken();
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
        displayAddresses(addresses);
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось загрузить адреса");
    });
}

// Display user addresses
function displayAddresses(addresses) {
    const addressesList = document.getElementById('addresses-list');
    const addressCount = document.getElementById('address-count');
    const addAddressBtn = document.getElementById('add-address-btn');
    
    if (!addressesList) return;
    
    // Clear previous content
    addressesList.innerHTML = '';
    
    // Update address count
    if (addressCount) {
        addressCount.textContent = `(${addresses.length}/5)`;
    }
    
    // Disable add button if max addresses reached
    if (addAddressBtn) {
        addAddressBtn.disabled = addresses.length >= 5;
    }
    
    // Display addresses
    if (addresses.length === 0) {
        const noAddresses = document.createElement('p');
        noAddresses.className = 'no-addresses';
        noAddresses.textContent = 'У вас пока нет сохраненных адресов';
        addressesList.appendChild(noAddresses);
    } else {
        addresses.forEach(addressItem => {
            const address = addressItem.address;
            const addressElement = document.createElement('div');
            addressElement.className = 'address-item';
            if (addressItem.is_default) {
                addressElement.classList.add('default-address');
            }
            
            // Address name
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
            
            // Address details
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
            
            // Address actions
            const addressActions = document.createElement('div');
            addressActions.className = 'address-actions';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-small';
            editBtn.textContent = 'Изменить';
            editBtn.addEventListener('click', () => editAddress(addressItem));
            addressActions.appendChild(editBtn);
            
            // Set as default button (only if not default)
            if (!addressItem.is_default) {
                const setDefaultBtn = document.createElement('button');
                setDefaultBtn.className = 'btn btn-small btn-secondary';
                setDefaultBtn.textContent = 'Сделать основным';
                setDefaultBtn.addEventListener('click', () => setDefaultAddress(addressItem.id));
                addressActions.appendChild(setDefaultBtn);
            }
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-small btn-danger';
            deleteBtn.textContent = 'Удалить';
            deleteBtn.addEventListener('click', () => deleteAddress(addressItem.id));
            addressActions.appendChild(deleteBtn);
            
            addressElement.appendChild(addressActions);
            
            addressesList.appendChild(addressElement);
        });
    }
}

// Show profile not authenticated message
function showProfileNotAuthenticated() {
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
}

// Update profile information
function updateProfile(event) {
    event.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
        showError("Вы не авторизованы");
        return;
    }
    
    const form = document.getElementById('profile-edit-form');
    const profileData = {
        first_name: form.querySelector('#first-name').value,
        last_name: form.querySelector('#last-name').value,
        phone_number: form.querySelector('#phone-number').value
    };
    
    fetch('/api/accounts/profiles/update_me/', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(profileData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при обновлении профиля');
        }
        return response.json();
    })
    .then(data => {
        showMessage("Профиль успешно обновлен");
        updateProfileInfo(); // Refresh profile data
        toggleEditMode(); // Exit edit mode
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось обновить профиль");
    });
}

// Add or update address
function saveAddress(event) {
    event.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
        showError("Вы не авторизованы");
        return;
    }
    
    const form = document.getElementById('address-edit-form');
    const addressId = form.querySelector('#address-id').value;
    const addressData = {
        name: form.querySelector('#address-name').value,
        is_default: form.querySelector('#is-default').checked,
        address: {
            district: form.querySelector('#district').value,
            street: form.querySelector('#street').value,
            house_number: form.querySelector('#house-number').value,
            floor: form.querySelector('#floor').value,
            apartment: form.querySelector('#apartment').value
        }
    };
    
    // Проверка обязательных полей
    if (!addressData.address.district || !addressData.address.street || !addressData.address.house_number) {
        showError("Район, улица и номер дома обязательны для заполнения");
        return;
    }
    
    let url = '/api/accounts/addresses/';
    let method = 'POST';
    
    // Если это редактирование существующего адреса
    if (addressId) {
        url += `${addressId}/`;
        method = 'PUT';
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(addressData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при сохранении адреса');
        }
        return response.json();
    })
    .then(data => {
        showMessage("Адрес успешно сохранен");
        loadUserAddresses(); // Refresh addresses
        toggleAddressEditMode(); // Exit edit mode
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось сохранить адрес");
    });
}

// Delete address
function deleteAddress(addressId) {
    if (!confirm("Вы действительно хотите удалить этот адрес?")) {
        return;
    }
    
    const token = getAuthToken();
    if (!token) {
        showError("Вы не авторизованы");
        return;
    }
    
    fetch(`/api/accounts/addresses/${addressId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при удалении адреса');
        }
        showMessage("Адрес успешно удален");
        loadUserAddresses(); // Refresh addresses
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось удалить адрес");
    });
}

// Set address as default
function setDefaultAddress(addressId) {
    const token = getAuthToken();
    if (!token) {
        showError("Вы не авторизованы");
        return;
    }
    
    fetch(`/api/accounts/addresses/${addressId}/set_default/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при установке адреса по умолчанию');
        }
        showMessage("Адрес установлен как основной");
        loadUserAddresses(); // Refresh addresses
    })
    .catch(error => {
        console.error('Error:', error);
        showError("Не удалось установить адрес по умолчанию");
    });
}

// Edit address
function editAddress(addressItem) {
    const form = document.getElementById('address-edit-form');
    if (!form) return;
    
    // Set form title
    document.getElementById('address-form-title').textContent = 'Редактирование адреса';
    
    // Fill form with address data
    form.querySelector('#address-id').value = addressItem.id;
    form.querySelector('#address-name').value = addressItem.name || '';
    form.querySelector('#district').value = addressItem.address.district || '';
    form.querySelector('#street').value = addressItem.address.street || '';
    form.querySelector('#house-number').value = addressItem.address.house_number || '';
    form.querySelector('#floor').value = addressItem.address.floor || '';
    form.querySelector('#apartment').value = addressItem.address.apartment || '';
    form.querySelector('#is-default').checked = addressItem.is_default;
    
    // Show address edit mode
    toggleAddressEditMode(true);
}

// Add new address
function addNewAddress() {
    const form = document.getElementById('address-edit-form');
    if (!form) return;
    
    // Set form title
    document.getElementById('address-form-title').textContent = 'Добавление адреса';
    
    // Reset form
    form.reset();
    form.querySelector('#address-id').value = '';
    
    // Show address edit mode
    toggleAddressEditMode(true);
}

// Toggle edit mode
function toggleEditMode() {
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const addressEditMode = document.getElementById('address-edit-mode');
    
    if (viewMode.style.display === 'none') {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        addressEditMode.style.display = 'none';
    } else {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        addressEditMode.style.display = 'none';
    }
}

// Toggle address edit mode
function toggleAddressEditMode(show) {
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const addressEditMode = document.getElementById('address-edit-mode');
    
    if (show) {
        viewMode.style.display = 'none';
        editMode.style.display = 'none';
        addressEditMode.style.display = 'block';
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        addressEditMode.style.display = 'none';
    }
}

// Request user's location using Telegram WebApp API
function requestLocation() {
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            // Показываем индикатор загрузки
            document.getElementById('location-spinner').style.display = 'inline-block';
            
            // В новых версиях API используется метод showPopup для запроса геолокации
            if (window.Telegram.WebApp.showPopup) {
                window.Telegram.WebApp.showPopup({
                    title: "Местоположение",
                    message: "Поделитесь своим местоположением для автоматического заполнения адреса",
                    buttons: [
                        {id: "share_location", type: "default", text: "Поделиться"}
                    ]
                }, function(buttonId) {
                    if (buttonId === "share_location") {
                        // После нажатия кнопки запрашиваем геолокацию
                        if (window.Telegram.WebApp.requestLocation) {
                            window.Telegram.WebApp.requestLocation(handleLocationResult, handleLocationError);
                        } else {
                            // Если метод requestLocation недоступен, используем браузерное API
                            useBrowserGeolocation();
                        }
                    } else {
                        // Пользователь отменил действие
                        document.getElementById('location-spinner').style.display = 'none';
                    }
                });
            } else if (window.Telegram.WebApp.requestLocation) {
                // Прямой вызов requestLocation, если доступен
                window.Telegram.WebApp.requestLocation(handleLocationResult, handleLocationError);
            } else {
                // Если методы Telegram недоступны, используем браузерное API
                useBrowserGeolocation();
            }
        } catch (error) {
            console.error("Error requesting location:", error);
            showError("Ошибка при запросе местоположения");
            document.getElementById('location-spinner').style.display = 'none';
        }
    } else {
        // Если WebApp API недоступен, используем браузерное API геолокации
        useBrowserGeolocation();
    }
}

// Обработчик успешного получения местоположения
function handleLocationResult(location) {
    if (location && location.latitude && location.longitude) {
        // Получаем адрес по координатам
        getAddressFromCoordinates(location.latitude, location.longitude);
    } else {
        showError("Не удалось получить местоположение");
        document.getElementById('location-spinner').style.display = 'none';
    }
}

// Обработчик ошибки получения местоположения
function handleLocationError() {
    showError("Ошибка при получении местоположения");
    document.getElementById('location-spinner').style.display = 'none';
}

// Использование браузерного API геолокации
function useBrowserGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
            },
            function(error) {
                showError(getGeolocationErrorMessage(error));
                document.getElementById('location-spinner').style.display = 'none';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showError("Геолокация не поддерживается вашим браузером");
        document.getElementById('location-spinner').style.display = 'none';
    }
}

// Получение адреса по координатам (через Nominatim OpenStreetMap API)
function getAddressFromCoordinates(latitude, longitude) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=ru`)
        .then(response => response.json())
        .then(data => {
            // Скрываем индикатор загрузки
            document.getElementById('location-spinner').style.display = 'none';
            
            if (data && data.address) {
                // Заполняем поля формы данными из ответа API
                const address = data.address;
                
                // Определяем район (может быть в разных полях в зависимости от региона)
                const district = address.suburb || address.district || address.neighbourhood || address.city_district || '';
                document.getElementById('district').value = district;
                
                // Улица
                document.getElementById('street').value = address.road || '';
                
                // Номер дома
                document.getElementById('house-number').value = address.house_number || '';
                
                showMessage("Адрес успешно определен");
            } else {
                showError("Не удалось определить адрес по координатам");
            }
        })
        .catch(error => {
            console.error("Error getting address:", error);
            showError("Ошибка при получении адреса");
            document.getElementById('location-spinner').style.display = 'none';
        });
}

// Получение текста ошибки геолокации
function getGeolocationErrorMessage(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            return "Пользователь отказал в доступе к местоположению";
        case error.POSITION_UNAVAILABLE:
            return "Информация о местоположении недоступна";
        case error.TIMEOUT:
            return "Истекло время ожидания запроса местоположения";
        case error.UNKNOWN_ERROR:
            return "Произошла неизвестная ошибка";
        default:
            return "Ошибка при определении местоположения";
    }
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

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the profile page
    if (document.getElementById('profile-container')) {
        // Update profile information if authenticated
        if (isAuthenticated()) {
            updateProfileInfo();
        } else {
            showProfileNotAuthenticated();
        }
        
        // Add event listeners
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', toggleEditMode);
        }
        
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', toggleEditMode);
        }
        
        const profileEditForm = document.getElementById('profile-edit-form');
        if (profileEditForm) {
            profileEditForm.addEventListener('submit', updateProfile);
        }
        
        const addAddressBtn = document.getElementById('add-address-btn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', addNewAddress);
        }
        
        const cancelAddressBtn = document.getElementById('cancel-address-btn');
        if (cancelAddressBtn) {
            cancelAddressBtn.addEventListener('click', () => toggleAddressEditMode(false));
        }
        
        const addressEditForm = document.getElementById('address-edit-form');
        if (addressEditForm) {
            addressEditForm.addEventListener('submit', saveAddress);
        }
        
        const getLocationBtn = document.getElementById('get-location-btn');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', requestLocation);
        }
    }
}); 