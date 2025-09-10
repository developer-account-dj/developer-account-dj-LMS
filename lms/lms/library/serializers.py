from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import StudentProfile, Book, BookRequest,CustomUser,Stream
from rest_framework.exceptions import ValidationError
import re
User = get_user_model()
from django.utils import timezone
# ------------------------------
# Register Serializer
# ------------------------------
# class RegisterSerializer(serializers.ModelSerializer):
#     email = serializers.EmailField(
#         required=True, 
#         validators=[UniqueValidator(queryset=User.objects.all())]
#     )
#     password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     password2 = serializers.CharField(write_only=True, required=True)

#     class Meta:
#         model = User
#         fields = ('username', 'email', 'password', 'password2')

#     def validate(self, attrs):
#         if attrs['password'] != attrs['password2']:
#             raise serializers.ValidationError({"password": "Passwords do not match."})
#         return attrs

#     def create(self, validated_data):
#         validated_data.pop('password2')
#         password = validated_data.pop('password')

#         user = User.objects.create(
#             **validated_data,
#             is_student=True,
#             is_active=False  # Will be activated after admin approval
#         )
#         user.set_password(password)
#         user.save()

#         StudentProfile.objects.create(user=user)  # `id` (roll number) auto-generated

#         return user

#     def to_representation(self, instance):
#         rep = {
#             "username": instance.username,
#             "email": instance.email,
#             "is_student": instance.is_student,
#             "is_active": instance.is_active
#         }
#         if hasattr(instance, 'student_profile'):
#             rep['rollno'] = instance.student_profile.id  # `id` is rollno
#         return rep



import re
from rest_framework.exceptions import ValidationError

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        # validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
    

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        usernames=attrs.get("username")

        if password != password2:
            raise ValidationError({"password": "Passwords do not match."})
        

        if User.objects.filter(username=usernames).exists():
            raise ValidationError({"username": "A user with this username already exists."})

        # ✅ Check and store password strength
        strength = self.check_password_strength(password)
        if strength == "Weak":
            raise ValidationError({
                "password": "Password is too weak. Use uppercase, lowercase, numbers, and special characters."
            })

        self.context['password_strength'] = strength
        return attrs

    def check_password_strength(self, password):
        length_error = len(password) < 8
        digit_error = re.search(r"\d", password) is None
        uppercase_error = re.search(r"[A-Z]", password) is None
        lowercase_error = re.search(r"[a-z]", password) is None
        symbol_error = re.search(r"[!@#$%^&*(),.?\":{}|<>]", password) is None

        score = sum([not length_error, not digit_error, not uppercase_error, not lowercase_error, not symbol_error])

        if score <= 2:
            return "Weak", "Password is too weak. Use uppercase, lowercase, numbers, and special characters."
        elif score == 3 or score == 4:
            return "Medium", "Password strength is medium."
        else:
            return "Strong", "Password is strong."

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User.objects.create(
            **validated_data,
            is_student=True,
            is_active=False
        )
        user.set_password(password)
        user.save()

        StudentProfile.objects.create(user=user)
        return user

    def to_representation(self, instance):
        rep = {
            "username": instance.username,
            "email": instance.email,
            "is_student": instance.is_student,
            "is_active": instance.is_active,
        }
        if hasattr(instance, 'student_profile'):
            rep['rollno'] = instance.student_profile.id
        # ✅ Include password strength if available
        if 'password_strength' in self.context:
            rep['password_strength'] = self.context['password_strength']
        return rep

# ------------------------------
# Student Profile Serializer
# ------------------------------
class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'first_name', 'last_name','email']

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer()
    stream = serializers.StringRelatedField()  # ✅ This will return stream.name

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'stream', 'is_approved']
        read_only_fields = ['id', 'is_approved']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)

        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return super().update(instance, validated_data)

# ------------------------------
# Book Serializer
# ------------------------------
class BookSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'author_name',
            'stream', 'stream_name', 'publication_date', 'quantity',
            'created_at', 'created_by', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['created_by', 'updated_by']


class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ['id', 'name']

# ------------------------------
# Book Request Serializer
# ------------------------------


class BookRequestSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()   # compute on serializer side
    was_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = BookRequest
        fields = [
            'id', 'student', 'book', 'book_title',
            'is_approved', 'requested_at', 'approved_at',
            'return_due_date', 'is_returned', 'returned_at',
            'is_overdue', 'pdf_url','was_overdue'
        ]
        read_only_fields = [
            'is_approved', 'requested_at', 'approved_at',
            'return_due_date', 'is_returned', 'returned_at',
            'is_overdue', 'pdf_url','was_overdue'
        ]

    def get_is_overdue(self, obj):
        if not obj.is_approved or obj.is_returned or not obj.return_due_date:
            return False
        return timezone.now() > obj.return_due_date

    def get_pdf_url(self, obj):
        if obj.is_approved and obj.book and obj.book.pdf:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.book.pdf.url)
            return obj.book.pdf.url
        return None

