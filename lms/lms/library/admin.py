from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from .models import (
    CustomUser,
    StudentProfile,
    Stream,
    Author,
    Book,
    BookRequest
)


# ✅ CustomUser Admin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'is_student', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('is_student', 'is_active', 'is_staff')
    search_fields = ('username', 'email')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('is_student',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('is_student',)}),
    )


# ✅ StudentProfile Admin
@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'stream', 'is_approved']
    search_fields = ['id', 'user__username']
    readonly_fields = ['id']

    def approve_students(self, request, queryset):
        for profile in queryset:
            profile.is_approved = True
            profile.user.is_active = True
            profile.user.save()
            profile.save()
        self.message_user(request, "Selected students approved.")

    approve_students.short_description = "Approve selected students"
    actions = [approve_students]

# ✅ Stream Admin
@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


# ✅ Author Admin
@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("id", 'name',)
    search_fields = ('name',)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    change_list_template = "admin/library/book/change_list.html"
    list_per_page = 10
    search_fields = ('title', 'author__name')

# ✅ BookRequest Admin
@admin.register(BookRequest)
class BookRequestAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'student', 'book', 'is_approved', 'requested_at',
        'approved_at','is_overdue_display', 'return_due_date', 'is_returned', 'returned_at'
    )
    list_filter = ('is_approved', 'is_returned', 'book')
    search_fields = ('student__user__username', 'book__title')
    actions = ['approve_selected_requests']

    def approve_selected_requests(self, request, queryset):
        for book_request in queryset.filter(is_approved=False):
            if book_request.book.quantity > 0:
                book_request.is_approved = True
                book_request.approved_at = timezone.now()
                book_request.return_due_date = book_request.approved_at + timezone.timedelta(days=7)
                book_request.book.quantity -= 1
                book_request.book.save()
                book_request.save()
        self.message_user(request, "Selected requests approved where possible.")
    approve_selected_requests.short_description = "Approve selected book requests"


    def is_overdue_display(self, obj):
        return obj.is_overdue
    is_overdue_display.boolean = True
    is_overdue_display.short_description = "Overdue?"
