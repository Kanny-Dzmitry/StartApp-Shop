from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile, Address
from .serializers import ProfileSerializer, AddressSerializer, UserSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        #Пользователь видит только свой профиль
        return Profile.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        #Получение профиля текущего пользователя
        isinstance = self.get_object()
        serializer = self.get_serializer(isinstance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_4000_BAD_REQEST)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_address(self, request):
        #эндпоинт для обновления адреса
        profile = request.user.profile
        #Если у профиля нету адреса, будет создан новый
        if not profile.address:
            address_serializer = AddressSerializer(data=request.data)
            if address_serializer.is_valid:
                address = address_serializer.save()
                profile.address = address
                profile.save()
                return Response(address_serializer.data)
            return Response(address_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
