(function($) {
    $(document).ready(function() {
        // Функция для управления сворачиванием/разворачиванием слайдов
        function setupCollapsibleInlines() {
            $('.inline-related').each(function() {
                var $inline = $(this);
                var $header = $inline.find('h3');
                
                // Добавляем иконку для сворачивания/разворачивания
                if (!$header.find('.collapse-toggle').length) {
                    $header.prepend(
                        '<span class="collapse-toggle">-</span>'
                    );
                }
                
                // Обработчик клика по заголовку
                $header.find('.collapse-toggle').on('click', function(e) {
                    e.stopPropagation();
                    var $this = $(this);
                    var $inlineContent = $inline.find('fieldset');
                    
                    if ($inlineContent.is(':visible')) {
                        $inlineContent.slideUp(300);
                        $inline.addClass('collapsed');
                        $this.text('+');
                    } else {
                        $inlineContent.slideDown(300);
                        $inline.removeClass('collapsed');
                        $this.text('-');
                    }
                });
            });
        }
        
        // Функция для создания контейнера предпросмотра изображений
        function createImagePreviewContainers() {
            $('.field-image').each(function() {
                var $imageField = $(this);
                var $previewField = $imageField.closest('.form-row').next('.field-image_preview');
                
                // Если нет контейнера для динамического предпросмотра, создаем его
                if (!$imageField.find('.dynamic-preview-container').length) {
                    $imageField.append('<div class="dynamic-preview-container image-preview-container" style="display:none;"></div>');
                }
            });
        }
        
        // Функция для предпросмотра изображений при загрузке
        function setupImagePreviews() {
            createImagePreviewContainers();
            
            // Обработчик изменения файла
            $('.field-image input[type="file"]').on('change', function() {
                var input = this;
                var $previewContainer = $(this).closest('.field-image').find('.dynamic-preview-container');
                
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    
                    reader.onload = function(e) {
                        $previewContainer.html('<p><strong>Предпросмотр загружаемого изображения:</strong></p>' +
                                              '<img src="' + e.target.result + '" style="max-height: 200px; max-width: 100%; border-radius: 5px;" />');
                        $previewContainer.show();
                    };
                    
                    reader.readAsDataURL(input.files[0]);
                } else {
                    $previewContainer.hide();
                }
            });
        }
        
        // Функция для улучшения интерфейса управления порядком слайдов
        function setupOrderControls() {
            $('.field-order').each(function() {
                var $orderField = $(this);
                
                // Проверяем, не добавлены ли уже кнопки
                if ($orderField.find('.order-controls').length === 0) {
                    var $input = $orderField.find('input');
                    
                    // Добавляем кнопки для увеличения/уменьшения порядка
                    var $controls = $('<div class="order-controls" style="margin-top: 5px;"></div>');
                    var $upButton = $('<button type="button" class="order-up" style="margin-right: 5px;">↑</button>');
                    var $downButton = $('<button type="button" class="order-down">↓</button>');
                    
                    $controls.append($upButton).append($downButton);
                    $orderField.append($controls);
                    
                    // Обработчики для кнопок
                    $upButton.on('click', function(e) {
                        e.preventDefault();
                        var currentValue = parseInt($input.val()) || 0;
                        $input.val(Math.max(0, currentValue - 1));
                    });
                    
                    $downButton.on('click', function(e) {
                        e.preventDefault();
                        var currentValue = parseInt($input.val()) || 0;
                        $input.val(currentValue + 1);
                    });
                }
            });
        }
        
        // Функция для подтверждения удаления слайда
        function setupDeleteConfirmation() {
            $('.inline-deletelink').on('click', function(e) {
                return confirm('Вы уверены, что хотите удалить этот слайд?');
            });
        }
        
        // Функция для улучшения интерфейса управления видимостью
        function setupVisibilityToggle() {
            $('.field-is_visible input[type="checkbox"]').each(function() {
                var $checkbox = $(this);
                var $label = $checkbox.closest('label');
                
                // Удаляем предыдущие стили, если они были применены
                $label.removeAttr('style');
                
                // Создаем обертку для чекбокса, если её еще нет
                if (!$label.find('.visibility-toggle').length) {
                    $checkbox.wrap('<span class="visibility-toggle"></span>');
                }
                
                var $toggle = $checkbox.closest('.visibility-toggle');
                updateVisibilityToggleClass($toggle, $checkbox.prop('checked'));
                
                $checkbox.on('change', function() {
                    updateVisibilityToggleClass($toggle, $(this).prop('checked'));
                });
            });
        }
        
        // Вспомогательная функция для обновления класса переключателя видимости
        function updateVisibilityToggleClass($toggle, isChecked) {
            $toggle.removeClass('visible hidden');
            $toggle.addClass(isChecked ? 'visible' : 'hidden');
        }
        
        // Инициализация всех улучшений
        function init() {
            setupCollapsibleInlines();
            setupImagePreviews();
            setupOrderControls();
            setupDeleteConfirmation();
            setupVisibilityToggle();
            
            // Повторная инициализация при добавлении нового слайда
            $('.add-row a').on('click', function() {
                setTimeout(function() {
                    setupCollapsibleInlines();
                    setupImagePreviews();
                    setupOrderControls();
                    setupDeleteConfirmation();
                    setupVisibilityToggle();
                }, 500);
            });
        }
        
        // Запускаем инициализацию
        init();
        
        // Повторно запускаем инициализацию при загрузке динамического контента
        $(document).on('formset:added', function(event, $row, formsetName) {
            setupCollapsibleInlines();
            setupImagePreviews();
            setupOrderControls();
            setupDeleteConfirmation();
            setupVisibilityToggle();
        });
    });
})(django.jQuery); 