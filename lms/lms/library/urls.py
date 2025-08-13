from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterAPIView,
    CustomTokenObtainPairView,
    BookListCreateAPIView,
    BookDetailAPIView,
    BookRequestListCreateAPIView,
    ApproveBookRequestAPIView,
    StudentProfileAPIView,
    AdminStudentListAPIView,
    AdminApproveStudentAPIView,
    AdminApproveUserAPIView,
    AdminDeactivateStudentAPIView,
    StudentProfileUpdateAPIView,
    ReturnBookAPIView,
    ChangePasswordView,
    StreamListAPIView
)

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),

    # Book endpoints
    path('books/', BookListCreateAPIView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', BookDetailAPIView.as_view(), name='book-detail'),
    path('streams/', StreamListAPIView.as_view(), name='stream-list'),


    # Book request endpoints
    path('book-requests/', BookRequestListCreateAPIView.as_view(), name='book-request-list-create'),
    path('book-requests/<int:pk>/approve/', ApproveBookRequestAPIView.as_view(), name='book-request-approve'),

    # Student profile
    path('student/profile/', StudentProfileAPIView.as_view(), name='student-profile'),

    # Admin - Student management
    path('admin/students/', AdminStudentListAPIView.as_view(), name='admin-student-list'),
    path('admin/students/<str:pk>/approve/', AdminApproveStudentAPIView.as_view(), name='admin-student-approve'),

    # Admin - User management
    path('admin/students/<str:pk>/deactivate/', AdminDeactivateStudentAPIView.as_view(), name='admin-deactivate-student'),
    path('admin/users/<int:pk>/approve/', AdminApproveUserAPIView.as_view(), name='admin-user-approve'),

     # For students updating their own profile
    path('profile/update/', StudentProfileUpdateAPIView.as_view(), name='update-own-profile'),

    # For admins updating any student profile
    
    path('admin/students/<str:pk>/update/', StudentProfileUpdateAPIView.as_view(), name='admin-update-student'),

    #return book
    path('book-requests/<int:pk>/return/', ReturnBookAPIView.as_view(), name='book-return'),

]
