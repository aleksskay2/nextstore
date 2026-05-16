from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

class RegionChatPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        try:
            return super().paginate_queryset(queryset, request, view)
        except NotFound:
            # 🔥 вместо 404 — пустой список
            self.page = None
            return []

    def get_paginated_response(self, data):
        # 🔥 разворачиваем обратно
        data = list(reversed(data))

        # 🔥 ИСПРАВЛЕНИЕ: Безопасно достаем параметры. Если self.page = None, возвращаем 0 и null
        count = self.page.paginator.count if self.page else 0
        next_link = self.get_next_link() if self.page else None
        previous_link = self.get_previous_link() if self.page else None

        return Response({
            "count": count,
            "next": next_link,
            "previous": previous_link,
            "results": data,
        })