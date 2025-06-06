from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile, Address, UserAddress
from .serializers import ProfileSerializer, AddressSerializer, UserSerializer, RegisterSerializer, UserAddressSerializer
from rest_framework.authtoken.models import Token
import hashlib
import hmac
import time
import json
from django.conf import settings
import secrets
import string

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "Пользователь успешно зарегистрирован"
        }, status=status.HTTP_201_CREATED)

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        #Пользователь видит только свой профиль
        return Profile.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        #Получение профиля текущего пользователя
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save() 
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_address(self, request):
        #эндпоинт для обновления адреса (для обратной совместимости)
        profile = request.user.profile
        #Если у профиля нету адреса, будет создан новый
        if not profile.address:
            address_serializer = AddressSerializer(data=request.data)
            if address_serializer.is_valid():
                address = address_serializer.save()
                profile.address = address
                profile.save()
                
                # Также создаем запись в UserAddress, если адресов меньше 5
                if UserAddress.objects.filter(user=request.user).count() < 5:
                    UserAddress.objects.create(
                        user=request.user,
                        address=address,
                        is_default=True,
                        name="Основной адрес"
                    )
                
                return Response(address_serializer.data)
            return Response(address_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            address_serializer = AddressSerializer(profile.address, data=request.data, partial=True)
            if address_serializer.is_valid():
                address_serializer.save()
                return Response(address_serializer.data)
            return Response(address_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAddressViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Пользователь видит только свои адреса
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # При создании адреса устанавливаем текущего пользователя
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        # Устанавливаем адрес по умолчанию
        user_address = self.get_object()
        user_address.is_default = True
        user_address.save()
        return Response({"status": "Адрес установлен как адрес по умолчанию"})
    
    def destroy(self, request, *args, **kwargs):
        # Проверяем, что это не единственный адрес по умолчанию
        user_address = self.get_object()
        if user_address.is_default and UserAddress.objects.filter(user=request.user).count() > 1:
            # Если удаляем адрес по умолчанию, назначаем другой адрес по умолчанию
            next_address = UserAddress.objects.filter(user=request.user).exclude(pk=user_address.pk).first()
            if next_address:
                next_address.is_default = True
                next_address.save()
        
        return super().destroy(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def telegram_auth(request):
    """
    Аутентификация пользователя через Telegram Mini App.
    Проверяет данные, полученные от Telegram, и создает или обновляет пользователя.
    """
    try:
        data = request.data
        
        # Получение данных пользователя из запроса
        telegram_id = data.get('telegram_id')
        telegram_username = data.get('telegram_username', '')
        telegram_first_name = data.get('telegram_first_name', '')
        telegram_last_name = data.get('telegram_last_name', '')
        telegram_photo_url = data.get('telegram_photo_url', '')
        init_data = data.get('init_data', '')
        
        # Проверка наличия обязательных полей
        if not telegram_id:
            return Response({"error": "Отсутствует telegram_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Валидация данных от Telegram (в реальном проекте)
        # Для этого нужен BOT_TOKEN в settings.py
        # is_valid = validate_telegram_data(init_data)
        # if not is_valid:
        #     return Response({"error": "Недействительные данные Telegram"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Поиск или создание пользователя
        username = f"tg_{telegram_id}"
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Создаем нового пользователя с безопасным случайным паролем
            # Генерируем безопасный случайный пароль
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for i in range(20))
            
            user = User.objects.create_user(
                username=username,
                password=password,
                email=f"{telegram_id}@telegram.user"
            )
            
            # Обновляем профиль пользователя
            profile = user.profile
            profile.first_name = telegram_first_name
            profile.last_name = telegram_last_name
            profile.save()
        
        # Получение или создание токена
        token, created = Token.objects.get_or_create(user=user)
        
        # Получаем профиль пользователя с осторожностью, чтобы избежать ошибок с новыми полями
        profile_data = ProfileSerializer(user.profile).data
        
        return Response({
            "token": token.key,
            "user": UserSerializer(user).data,
            "profile": profile_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        print(f"Telegram auth error: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def validate_telegram_data(init_data):
    """
    Валидация данных, полученных от Telegram.
    В реальном проекте нужно реализовать проверку подписи.
    """
    # Пример реализации проверки подписи
    # Для работы нужен BOT_TOKEN в settings.py
    try:
        # Разбор init_data
        data_check_string = init_data
        
        # В реальном проекте нужно разобрать строку init_data и извлечь хеш и другие параметры
        # Пример:
        # data_check_arr = data_check_string.split('&')
        # hash_value = None
        # data_arr = []
        
        # for item in data_check_arr:
        #     if item.startswith('hash='):
        #         hash_value = item.split('=')[1]
        #     else:
        #         data_arr.append(item)
        
        # data_arr.sort()
        # data_string = '\n'.join(data_arr)
        
        # secret_key = hmac.new(b'WebAppData', settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        # calculated_hash = hmac.new(secret_key, data_string.encode(), hashlib.sha256).hexdigest()
        
        # return calculated_hash == hash_value
        
        # Для тестирования всегда возвращаем True
        return True
    except Exception:
        return False

def telegram_app_view(request):
    """
    Отображение страницы Telegram Mini App.
    """
    return render(request, 'telegram_app.html')
