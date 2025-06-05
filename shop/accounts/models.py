from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Address(models.Model):
    district = models.CharField(max_length=100, verbose_name="Район")
    street = models.CharField(max_length=100, verbose_name="Улица")
    house_number = models.CharField(null=True, blank=True, max_length=100, verbose_name="Номер дома")
    floor = models.CharField(null=True, blank=True, max_length=20, verbose_name="Этаж")
    apartment = models.CharField(null=True, blank=True, max_length=20, verbose_name="Номер квартиры")
    full_address = models.TextField(null=True, blank=True, verbose_name="Полный адрес")
    
    def __str__(self):
        return f"{self.district}, {self.street}, д. {self.house_number}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Фамилия")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Номер телефона")
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='profiles')
    
    def __str__(self):
        return f"Профиль пользователя {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
