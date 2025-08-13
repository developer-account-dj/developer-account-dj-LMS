from django.apps import AppConfig


class LibraryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'library'


class YourAppConfig(AppConfig):
    name = 'library'

    def ready(self):
        import library.signals  # 🔄 ensure signals get loaded
