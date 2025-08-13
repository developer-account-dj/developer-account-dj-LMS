from django.utils import timezone
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string

# -----------------------
# Utility Function
# -----------------------

def generate_rollno():
    # Note: This is not perfect if students get deleted, but it's simple and effective
    next_id = StudentProfile.objects.count() + 1
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=2))
    return f"roll{next_id}{suffix}"


# -----------------------
# Custom User Model
# -----------------------

class CustomUser(AbstractUser):
    is_student = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)  # Inactive until approved

    def __str__(self):
        return self.username


# -----------------------
# Stream Model
# -----------------------

class Stream(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


# -----------------------
# Student Profile Model
# -----------------------

class StudentProfile(models.Model):
    id = models.CharField(
        primary_key=True,
        default=generate_rollno,
        max_length=20,
        unique=True,
        editable=False
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    stream = models.ForeignKey(
        Stream,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.id

    def delete(self, *args, **kwargs):
        user = self.user
        super().delete(*args, **kwargs)
        user.delete()  # 👈 This deletes the associated user



# -----------------------
# Author Model
# -----------------------

class Author(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


# -----------------------
# Book Model
# -----------------------

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True)
    publication_date = models.DateField()
    quantity = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books_created',
        limit_choices_to={'is_staff': True, 'is_student': False}
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books_updated',
        limit_choices_to={'is_staff': True, 'is_student': False}
    )

    def __str__(self):
        return self.title

    class Meta:
        unique_together = ('title', 'author', 'stream', 'created_by')



# -----------------------
# Book Request Model
# -----------------------

class BookRequest(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='book_requests')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='book_requests')
    is_approved = models.BooleanField(default=False)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    return_due_date = models.DateTimeField(null=True, blank=True)  # ✅ new
    is_returned = models.BooleanField(default=False)               # ✅ new
    returned_at = models.DateTimeField(null=True, blank=True)      # ✅ new

    def __str__(self):
        return f"{self.student.user.username} requested {self.book.title}"
    
    @property
    def is_overdue(self):
        return (
            self.is_approved and 
            not self.is_returned and 
            self.return_due_date and 
            timezone.now() > self.return_due_date
        )




from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=StudentProfile)
def delete_related_user(sender, instance, **kwargs):
    if instance.user:
        instance.user.delete()
