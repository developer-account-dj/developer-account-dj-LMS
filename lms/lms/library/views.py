from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import status
from django.utils import timezone
from django.utils.timezone import localtime, make_aware
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from datetime import datetime
from django.db.models import Q
from .models import Book, StudentProfile, BookRequest, Stream, CustomUser as User
from .serializers import (
    RegisterSerializer,
    BookSerializer,
    StudentProfileSerializer,
    BookRequestSerializer
)

# ----------------------------
# Registration View
# ----------------------------
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Registration successful. Awaiting admin approval.",
                "data": serializer.data
            }, status=201)
        return Response({
            "success": False,
            "message": "Registration failed.",
            "data": serializer.errors
        }, status=400)

# ----------------------------
# Custom JWT Login View
# ----------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)
        access = refresh.access_token

        data['access_token_expires'] = localtime(make_aware(datetime.fromtimestamp(access['exp']))).strftime('%Y-%m-%d %H:%M:%S')
        data['refresh_token_expires'] = localtime(make_aware(datetime.fromtimestamp(refresh['exp']))).strftime('%Y-%m-%d %H:%M:%S')

        return {
            "success": True,
            "message": "Login successful.",
            "data": data
        }

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # Validate inputs
        if not current_password or not new_password or not confirm_password:
            return Response({"success": False, "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check current password
        if not user.check_password(current_password):
            return Response({"success": False, "message": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        # Check password confirmation
        if new_password != confirm_password:
            return Response({"success": False, "message": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user.set_password(new_password)
        user.save()

        return Response({"success": True, "message": "Password updated successfully. Please log in again."}, status=status.HTTP_200_OK)

# ----------------------------
# Book Views
# ----------------------------
from .serializers import StreamSerializer

class StreamListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        streams = Stream.objects.all()
        serializer = StreamSerializer(streams, many=True)
        return Response({
            "success": True,
            "message": "Streams fetched successfully.",
            "data": serializer.data
        })
    

class BookListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get('search', '').strip()
        stream_id = request.query_params.get('stream', '').strip()

        books = Book.objects.all()

        # Search by title or author name
        if search_query:
            books = books.filter(
                Q(title__icontains=search_query) |
                Q(author__name__icontains=search_query)
            )

        # Filter by stream only if provided and not 'all'
        if stream_id and stream_id.lower() != "all":
            books = books.filter(stream_id=stream_id)

        serializer = BookSerializer(books, many=True)
        return Response({
            "success": True,
            "message": "Books fetched successfully.",
            "data": serializer.data
        })

    def post(self, request):
        serializer = BookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save(created_by=request.user, updated_by=request.user)
            return Response({
                "success": True,
                "message": "Book created successfully.",
                "data": serializer.data
            }, status=201)
        except:
            return Response({
                "success": False,
                "message": "Book already exists.",
                "data": serializer.data
            }, status=400)

class BookDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Book.objects.get(pk=pk)

    def get(self, request, pk):
        book = self.get_object(pk)
        serializer = BookSerializer(book)
        return Response({"success": True, "message": "Book fetched.", "data": serializer.data})

    def patch(self, request, pk):
        book = self.get_object(pk)
        serializer = BookSerializer(book, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response({"success": True, "message": "Book updated.", "data": serializer.data})

    def delete(self, request, pk):
        book = self.get_object(pk)
        book.delete()
        return Response({"success": True, "message": "Book deleted.", "data": []})

# ----------------------------
# Book Requests
# ----------------------------
class BookRequestListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff:
            requests = BookRequest.objects.select_related('student', 'book').all()
        else:
            requests = BookRequest.objects.filter(student__user=user)
        serializer = BookRequestSerializer(requests, many=True)
        return Response({
            "success": True,
            "message": "Book requests fetched.",
            "data": serializer.data
        })

    def post(self, request):
        student = request.user.student_profile
        data = request.data if isinstance(request.data, list) else [request.data]
        serializer = BookRequestSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        book_ids = [item['book'].id if hasattr(item['book'], 'id') else item['book'] for item in serializer.validated_data]
        existing = BookRequest.objects.filter(student=student, book__in=book_ids, is_approved=False)

        if existing.exists():
            titles = [r.book.title for r in existing]
            return Response({
                "success": False,
                "message": f"Already requested: {', '.join(titles)}.",
                "data": []
            }, status=400)

        created = []
        for item in serializer.validated_data:
            br = BookRequest.objects.create(student=student, book=item['book'])
            created.append(br)

        resp_serializer = BookRequestSerializer(created, many=True)
        return Response({
            "success": True,
            "message": f"{len(created)} request(s) created.",
            "data": resp_serializer.data
        }, status=201)

# ----------------------------
# Approve Book Request (Admin)
# ----------------------------
from datetime import timedelta
class ApproveBookRequestAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            req = BookRequest.objects.select_related('book').get(pk=pk)
            if req.is_approved:
                return Response({"success": False, "message": "Already approved.", "data": []}, status=400)
            if req.book.quantity < 1:
                return Response({"success": False, "message": "Book not available.", "data": []}, status=400)

            req.is_approved = True
            req.approved_at = timezone.now()
            req.return_due_date = req.approved_at + timedelta(days=7)
            req.save()

            req.book.quantity -= 1
            req.book.save()

            return Response({
                "success": True,
                "message": "Request approved, return due date set, and book quantity updated.",
                "data": BookRequestSerializer(req).data
            })
        except BookRequest.DoesNotExist:
            return Response({"success": False, "message": "Request not found.", "data": []}, status=404)


# ----------------------------
# Student Profile View
# ----------------------------
class StudentProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = StudentProfile.objects.filter(user=request.user)
        serializer = StudentProfileSerializer(profile, many=True)
        return Response({"success": True, "message": "Profile retrieved.", "data": serializer.data})

# ----------------------------
# Admin: List All Students
# ----------------------------
class AdminStudentListAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        students = StudentProfile.objects.select_related('user', 'stream').all()
        serializer = StudentProfileSerializer(students, many=True)
        return Response({"success": True, "message": "Students fetched.", "data": serializer.data})

# ----------------------------
# Admin: Approve Student
# ----------------------------
class AdminApproveStudentAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            student = StudentProfile.objects.get(pk=pk)
            if student.is_approved:
                return Response({"success": False, "message": "Student already approved.", "data": []}, status=400)

            student.is_approved = True
            student.save()
            student.user.is_active = True
            student.user.save()

            return Response({
                "success": True,
                "message": "Student approved.",
                "data": {
                    "username": student.user.username,
                    "rollno": student.id,
                    "is_active": student.user.is_active,
                    "is_approved": student.is_approved
                }
            })
        except StudentProfile.DoesNotExist:
            return Response({"success": False, "message": "Student not found.", "data": []}, status=404)

# ----------------------------
# Admin: Approve Any User
# ----------------------------
class AdminApproveUserAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_active:
                return Response({"success": False, "message": "User already approved.", "data": []}, status=400)

            user.is_active = True
            user.save()
            return Response({"success": True, "message": "User approved.", "data": []})
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found.", "data": []}, status=404)






class AdminDeactivateStudentAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            student = StudentProfile.objects.get(pk=pk)
            if not student.is_approved and not student.user.is_active:
                return Response({
                    "success": False,
                    "message": "Student is already deactivated.",
                    "data": []
                }, status=400)

            student.is_approved = False
            student.save()

            student.user.is_active = False
            student.user.save()

            return Response({
                "success": True,
                "message": "Student deactivated successfully.",
                "data": {
                    "username": student.user.username,
                    "rollno": student.id,
                    "is_active": student.user.is_active,
                    "is_approved": student.is_approved
                }
            })
        except StudentProfile.DoesNotExist:
            return Response({
                "success": False,
                "message": "Student not found.",
                "data": []
            }, status=404)
        

class StudentProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk=None):
        user = request.user

        # If no pk is provided, student is updating their own profile
        if not pk:
            try:
                profile = user.student_profile
            except StudentProfile.DoesNotExist:
                return Response({
                    "success": False,
                    "message": "Student profile not found.",
                    "data": []
                }, status=404)

            # Students can only edit their own profile
            if not user.is_staff and profile.user != user:
                return Response({
                    "success": False,
                    "message": "Permission denied.",
                    "data": []
                }, status=403)

        else:
            # Admin can update any student's profile
            if not user.is_staff:
                return Response({
                    "success": False,
                    "message": "Only admins can update other student profiles.",
                    "data": []
                }, status=403)

            try:
                profile = StudentProfile.objects.get(pk=pk)
            except StudentProfile.DoesNotExist:
                return Response({
                    "success": False,
                    "message": "Student not found.",
                    "data": []
                }, status=404)

        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Profile updated successfully.",
                "data": serializer.data
            })
        return Response({
            "success": False,
            "message": "Invalid data.",
            "data": serializer.errors
        }, status=400)
    


class ReturnBookAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            book_request = BookRequest.objects.select_related('book', 'student').get(pk=pk)

            if request.user != book_request.student.user:
                return Response({"success": False, "message": "You can't return this book.", "data": []}, status=403)

            if not book_request.is_approved:
                return Response({"success": False, "message": "This book is not approved yet.", "data": []}, status=400)

            if book_request.is_returned:
                return Response({"success": False, "message": "Book already returned.", "data": []}, status=400)

            book_request.is_returned = True
            book_request.returned_at = timezone.now()
            book_request.book.quantity += 1
            book_request.book.save()
            book_request.save()

            return Response({
                "success": True,
                "message": "Book returned successfully.",
                "data": BookRequestSerializer(book_request).data
            })

        except BookRequest.DoesNotExist:
            return Response({"success": False, "message": "Book request not found.", "data": []}, status=404)
