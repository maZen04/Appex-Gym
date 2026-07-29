from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Allows access only to employees with the Owner role."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Owner')
