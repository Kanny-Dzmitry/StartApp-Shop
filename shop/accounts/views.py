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
# Create your views here.
