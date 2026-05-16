# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# from channels.security.websocket import AllowedHostsOriginValidator
# from django.core.asgi import get_asgi_application
# import store.routing
# import os

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),

#     "websocket": AllowedHostsOriginValidator(
#         AuthMiddlewareStack(
#             URLRouter(
#                 store.routing.websocket_urlpatterns
#             )
#         )
#     ),
# })



# import os

# # Сначала устанавливаем DJANGO_SETTINGS_MODULE
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# from channels.security.websocket import AllowedHostsOriginValidator
# import store.routing
# from store.middleware import JWTAuthMiddleware  # кастомный

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AllowedHostsOriginValidator(
#         JWTAuthMiddleware(
#             AuthMiddlewareStack(
#                 URLRouter(store.routing.websocket_urlpatterns)
#             )
#         )
#     ),
# })



from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
import store.routing
from store.middleware import JWTAuthMiddleware

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                store.routing.websocket_urlpatterns
            )
        )
    ),
})
