
// hooks/useProductChatSocket.js
import { useEffect, useRef ,useCallback} from "react";
import { useProductStore } from "../components/store/useProductStore";
import { useAppStore } from "../components/store/appStore";

//  * Хук для работы с WebSocket уведомлениями чата по продукту.
//  * Работает с событиями "прочитано" (read_receipt).
//  */

import { toast } from "react-toastify";

// export function useProductChatSocket(productId, currentUserId, companionId, messageRefs) {
//   const socketRef = useRef(null);
//   const isChatOpenRef = useRef(false);

//   const addMessage = useProductStore((s) => s.addMessage);
//   const markDelivered = useProductStore((s) => s.markDelivered);
//   const markRead = useProductStore((s) => s.markRead);

//   useEffect(() => {
//     if (!productId || !currentUserId || !companionId) return;

//     if (socketRef.current) return; // 🔥 ключевой момент, не создавать повторно

//     const token = localStorage.getItem("access");
//     const wsUrl = `ws://127.0.0.1:8000/ws/product-chat/${productId}/${currentUserId}/?token=${token}`;
//     const socket = new WebSocket(wsUrl);

//     socketRef.current = socket;

//     socket.onopen = () => {
//       isChatOpenRef.current = true;
//       console.log("Product WS connected", productId);

//       // Чат открыт — можно сразу отправить mark_as_read
//       socket.send(
//         JSON.stringify({
//           type: "chat_open",
//         })
//       );
//     };

//     socket.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       console.log("Product WS data:", data);

//       // Новое сообщение
//       if (data.type === "new_message" && data.message) {
//         console.log('data', data)
//         addMessage(data.message);

//         // Отправляем read, если сообщение от собеседника
//         if (data.message.sender !== currentUserId) {
//           socket.send(
//             JSON.stringify({
//               type: "messages_read",
//               sender_id: data.message.sender,
//             })
//           );
//         }
        

//         // Уведомление о новых сообщениях
//         if (data.message.sender_id !== currentUserId && messageRefs?.current) {
//           const ref = messageRefs.current[data.message.id];
//           if (ref?.current) {
//             ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
//             ref.current.style.background = "#ffff99";
//             setTimeout(() => (ref.current.style.background = "transparent"), 1000);
//           }
//         }
//       }

//       // Обновление статуса прочтения
//       if (data.type === "messages_read") {
//           console.log('messages_read', data)
//         markRead(data.sender_id);
//       }

//       if (data.type === "messages_delivered") {
//         console.log('messages_delivered', data.type)
//         markDelivered({
//           receiverId: data.receiver,
//           productId: data.product,
//         });
//       }


//       // Можно добавить уведомления по reply или другим типам
//       if (data.type === "reply_notification") {
      
//         toast.info(`${data.from_user} ответил на ваше сообщение`, {
//           onClick: () => {
//             const ref = messageRefs.current[data.original_message_id];
//             if (ref?.current) {
//               ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
//               ref.current.style.background = "#ffff99";
//               setTimeout(() => (ref.current.style.background = "transparent"), 1000);
//             }
//           },
//         });
//       }
//     };

//     socket.onclose = () => {
//       console.log("Product WS disconnected");
//     };

//     socket.onerror = (err) => {
//       console.error("Product WS error:", err);
//     };

//     return () => {
//       socketRef.current?.close();
//       socketRef.current = null;
//     };
//   }, [productId, currentUserId, companionId]);

//   return { socket: socketRef.current };
// }












/**
 * Хук для работы с WebSocket чата продукта
 */

export function useProductChatSocket(productId, currentUserId, companionId, messageRefs) {
  const socketRef = useRef(null);

  const addMessage = useProductStore((s) => s.addMessage);
  const markDelivered = useProductStore((s) => s.markDelivered);
  const markRead = useProductStore((s) => s.markRead);


  const connect = useCallback(() => {
    // ⚠️ Создаём сокет только если все данные есть
    console.log('connect')
    console.log('productId', productId)
    console.log('currentUserId',currentUserId )
    console.log('companionId', companionId )
    const token = localStorage.getItem("access");
    // console.log('token', token )

    if (!productId || !currentUserId || !companionId || !token) return;
    if (socketRef.current) return;

    
    const wsUrl = `ws://127.0.0.1:8000/ws/product-chat/${productId}/${currentUserId}/?token=${token}`;
    const socket = new WebSocket(wsUrl);

    


    socketRef.current = socket;
   

    // ──────────────────────────────
    socket.onopen = () => {
      console.log("Product WS connected", productId);

      // Отправляем сразу, когда соединение открыто
     socket.send(JSON.stringify({
      type: "chat_open",
      sender_id: companionId
    }));
   
    

    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("Product WS data:", data);

      if (data.type === "new_message" && data.message) {
        addMessage(data.message);

        if (data.message.sender !== currentUserId) {
          socket.send(
            JSON.stringify({ type: "messages_read", sender_id: data.message.sender })
          );
        }

        if (data.message.sender !== currentUserId && messageRefs?.current) {
          const ref = messageRefs.current[data.message.id];
          if (ref?.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
            ref.current.style.background = "#ffff99";
            setTimeout(() => (ref.current.style.background = "transparent"), 1000);
          }
        }
      }

      if (data.type === "messages_read") {
        markRead(data.sender_id);
      }

      if (data.type === "product_delivered") {
        markDelivered({ receiverId: data.receiver_id, productId: data.product_id });
      }

      if (data.type === "reply_notification") {
        toast.info(`${data.from_user} ответил на ваше сообщение`, {
          onClick: () => {
            const ref = messageRefs.current[data.original_message_id];
            if (ref?.current) {
              ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
              ref.current.style.background = "#ffff99";
              setTimeout(() => (ref.current.style.background = "transparent"), 1000);
            }
          },
        });
      }
    };

    socket.onclose = () => console.log("Product WS disconnected");
    socket.onerror = (err) => console.error("Product WS error:", err);
  }, [productId, currentUserId, companionId, addMessage, markRead, markDelivered, messageRefs]);

  const disconnect = useCallback(() => {
    if (
    socketRef.current &&
    socketRef.current.readyState === WebSocket.OPEN
  ) {
    socketRef.current.close();
  }

  socketRef.current = null;
  }, []);

  return { socket: socketRef.current, connect, disconnect };
}
