import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, Product
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user1_id = self.scope['url_route']['kwargs']['user1_id']
        self.user2_id = self.scope['url_route']['kwargs']['user2_id']
        
        self.room_name = f"{self.user1_id}_{self.user2_id}"

        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
            await self.channel_layer.group_discard(
                 self.room_group_name,
                 self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        sender_id = data['sender_id']
        receiver_id = data['receiver_id'] 
        product_id = data['receiver']   
        text = data['text']

        sender = await User.objects.aget(id=sender_id)
        receiver = await User.objects.aget(id=receiver_id)
        
        message = await self.save_message(sender_id, receiver_id, product_id, text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type":"chat_message",
                'message':{
                     "id":message.id,
                    "sender":sender_id,
                    "receiver":receiver_id,
                    "text":text,
                    "sender_username":message.sender.username,
                    'created_at':str(message.created_at),

                }
            

            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
    
    def save_message(self, sender_id, receiver_id, product_id , text):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        product = Product.objects.get(id=product_id)
        return Message.objects.create(sender=sender, receiver=receiver, product=product, text=text)