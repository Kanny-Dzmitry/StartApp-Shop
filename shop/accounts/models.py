from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError

class Address(models.Model):
    district = models.CharField(max_length=100, verbose_name="Район")
    street = models.CharField(max_length=100, verbose_name="Улица")
    house_number = models.CharField(null=True, blank=True, max_length=100, verbose_name="Номер дома")
    floor = models.CharField(null=True, blank=True, max_length=20, verbose_name="Этаж")
    apartment = models.CharField(null=True, blank=True, max_length=20, verbose_name="Номер квартиры")
    full_address = models.TextField(null=True, blank=True, verbose_name="Полный адрес")
    
    def __str__(self):
        return f"{self.district}, {self.street}, д. {self.house_number}"

class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_addresses')
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False, verbose_name="Адрес по умолчанию")
    name = models.CharField(max_length=100, blank=True, verbose_name="Название адреса")
    
    class Meta:
        verbose_name = "Адрес пользователя"
        verbose_name_plural = "Адреса пользователей"
        unique_together = ('user', 'address')
        ordering = ['-is_default', 'id']
    
    def __str__(self):
        return f"{self.name or 'Адрес'} пользователя {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Проверяем, что у пользователя не более 5 адресов
        if not self.pk and UserAddress.objects.filter(user=self.user).count() >= 5:
            raise ValidationError("Пользователь не может иметь более 5 адресов")
        
        # Если этот адрес установлен как адрес по умолчанию, сбрасываем флаг у других адресов
        if self.is_default:
            UserAddress.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        
        # Если это первый адрес пользователя, делаем его адресом по умолчанию
        if not self.pk and not UserAddress.objects.filter(user=self.user).exists():
            self.is_default = True
            
        super().save(*args, **kwargs)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Фамилия")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Номер телефона")
    # Оставляем поле address для обратной совместимости, но помечаем его как устаревшее
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='profiles')
    
    def __str__(self):
        return f"Профиль пользователя {self.user.username}"
    
    @property
    def default_address(self):
        """Возвращает адрес по умолчанию пользователя"""
        user_address = UserAddress.objects.filter(user=self.user, is_default=True).first()
        if user_address:
            return user_address.address
        return self.address  # Возвращаем старый адрес, если новых нет

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
