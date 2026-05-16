from django.urls import re_path
from .consumers import PrivateChatConsumer, UserGlobalConsumer, RegionChatConsumer, ProductChatConsumer, CallConsumer, GroupChatConsumer

websocket_urlpatterns = [
    # WebRTC звонки
    re_path(r"ws/call/(?P<user_id>\d+)/$", CallConsumer.as_asgi()),

    # Чат
    re_path(r"ws/chat/(?P<user_id>\d+)/$", PrivateChatConsumer.as_asgi()),
      # Групповой чат
    re_path(r"ws/group/(?P<group_id>\d+)/$", GroupChatConsumer.as_asgi()),
     re_path(
        r"ws/product-chat/(?P<product_id>\d+)/(?P<user_id>\d+)/$",
        ProductChatConsumer.as_asgi(),
    ),

    re_path(r"ws/region/(?P<region_id>\d+)/$", RegionChatConsumer.as_asgi()),

    # re_path(r"ws/user/(?P<user_id>\d+)/$", UserGlobalConsumer.as_asgi()),
    re_path(r"ws/user/$", UserGlobalConsumer.as_asgi()),

]