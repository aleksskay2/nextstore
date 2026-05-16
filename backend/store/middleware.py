from urllib.parse import parse_qs
from channels.db import database_sync_to_async
import jwt
from django.conf import settings
from channels.middleware import BaseMiddleware

class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware для WebSocket: извлекает токен из query string, 
    проверяет JWT и добавляет user в scope.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        scope["jwt_token"] = token

        # По умолчанию анонимный пользователь
        scope["user"] = None

        if token:
            try:
                import django
                if not django.apps.apps.ready:
                    # Защита на случай, если Django ещё не готов
                    await database_sync_to_async(lambda: None)()

                # Получаем модель пользователя внутри метода
                from django.contrib.auth import get_user_model
                User = get_user_model()

                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("user_id")
                scope["user"] = await database_sync_to_async(User.objects.get)(id=user_id)
            except Exception as e:
                print("JWTAuthMiddleware error:", e)
                scope["user"] = None

        return await self.inner(scope, receive, send)
