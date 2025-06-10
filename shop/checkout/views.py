from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Create your views here.

# Представление для страницы оформления заказа
class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Получаем данные пользователя
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
        
        # Дополнительно получаем профиль пользователя с его данными
        try:
            profile = user.profile
            # Используем данные из профиля, а не из user, т.к. в профиле актуальные данные
            user_data.update({
                'first_name': profile.first_name or user.first_name,
                'last_name': profile.last_name or user.last_name,
                'phone_number': profile.phone_number or '',
                # Добавьте другие поля профиля по необходимости
            })
        except Exception as e:
            print(f"Ошибка при получении профиля пользователя: {str(e)}")
            user_data.update({
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': '',
            })
            
        return Response({
            'user': user_data,
        }, status=status.HTTP_200_OK)
