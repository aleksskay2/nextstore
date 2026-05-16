
import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../components/store/useChatStore"; // если используешь zustand
import { useAppStore } from "../components/store/appStore";
import { useProductStore } from "../components/store/useProductStore";
import { useOnlineStore } from "../components/store/useOnlineStore";
import { useMessageChatsStore } from "../components/store/useMessageChatsStore";


// export default function useGlobalSocket(userId) {
//   const wsRef = useRef(null);
  
//   const { setOnline, setOffline } = useOnlineStore();
//   const {setWsRef} = useAppStore()

//   useEffect(() => {
//     if (!userId) return;

//     const token = localStorage.getItem("access"); // или откуда хранишь JWT
    
//     const ws = new WebSocket(`ws://localhost:8000/ws/user/${userId}/?token=${token}`);
   
//     wsRef.current = ws;
//     setWsRef(wsRef); // сохраняем в стор

//     ws.onopen = () => {
//       console.log("🌍 GLOBAL WS OPEN");
//     };

//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       console.log('data Global -' ,data)

//       // 🔔 DELIVERED
//       if (data.type === "delivered") {
//         console.log("📦 DELIVERED:", data.message_id);

//         // обновляем store (пример)
//         if (setDelivered) {
//           setDelivered(data.message_id);
//         }
//       }

      
//        if (data.type === "online_status") {
//         if (data.online) {
//           setOnline(data.user_id);
//         } else {
//           setOffline(data.user_id);
//         }
//       }
    


//        if (data.type === "product_message_delivered") {
//              console.log("📦 product_delivered:", data.message_id);
//             useProductStore.getState().markDelivered({
//                     messageId: data.message_id,
//             });
           
//         }
       



//     };

//     ws.onerror = (e) => {
//       console.error("🌍 GLOBAL WS ERROR", e);
//     };

//     ws.onclose = () => {
//       console.warn("🌍 GLOBAL WS CLOSED");
//     };

//     return () => ws.close();
//   }, [userId, setOnline, setOffline]);

//   return wsRef;
// }





// export default function useGlobalSocket(userId) {
//   const wsRef = useRef(null);

//   const { setOnline, setOffline } = useOnlineStore();
//   const { setWsRef } = useAppStore();

//   useEffect(() => {
//     if (!userId) return;

//     const token = localStorage.getItem("access");
//     if (!token) return;

//     const ws = new WebSocket(
//       `ws://localhost:8000/ws/user/?token=${token}`
//     );

//     wsRef.current = ws;
//     setWsRef(ws); // ✅

//     ws.onopen = () => {
//       console.log("🌍 GLOBAL WS OPEN", userId);
//     };

//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       console.log("data Global -", data);

//       if (data.type === "online_status") {
//         data.online
//           ? setOnline(data.user_id)
//           : setOffline(data.user_id);
//       }

//       if (data.type === "delivered") {
//         console.log("📦 DELIVERED:", data.message_id);
//       }

//       if (data.type === "product_message_delivered") {
//         useProductStore.getState().markDelivered({
//           messageId: data.message_id,
//         });
//       }
//     };

//     ws.onerror = (e) => {
//       console.error("🌍 GLOBAL WS ERROR", e);
//     };

//     ws.onclose = () => {
//       console.warn("🌍 GLOBAL WS CLOSED", userId);
//     };

//     return () => {
//       console.log("🧹 CLOSE WS", userId);
//       ws.close();
//     };
//   }, [userId]); // 🔥 только userId

//   return wsRef;
// }











import { useStoryFeedStore } from "../components/store/useStoryFeedStore";
import { useStory } from "../components/store/useStory";

// export default function useGlobalSocket(userId) {
//   const wsRef = useRef(null);

//   const { setOnline, setOffline } = useOnlineStore();
//   const { addStoryViewer } = useStory.getState();
//   const { setWsRef } = useAppStore();

//     let pingInterval = useRef(null)
//   // 🔥 stories
//   const { loadStories } = useStoryFeedStore();

//   useEffect(() => {
//     if (!userId) return;

//     const token = localStorage.getItem("access");
//   ; // Храним ссылку на интервал здесь
//     if (!token) return;

//     const ws = new WebSocket(
//       `ws://localhost:8000/ws/user/?token=${token}`
//     );

//     wsRef.current = ws;
//     setWsRef(ws);

//     ws.onopen = () => {
//       console.log("🌍 GLOBAL WS OPEN", userId);
    
//       //   Очищаем старый интервал, если он был
//       if (pingInterval.current) clearInterval(pingInterval.current);

//       // Запускаем пинг
//       pingInterval.current = setInterval(() => {
//         if (ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify({ type: "ping" }));
//            console.log('ping')
//         }
       
//       }, 30000);

//     }


//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       console.log("🌍 GLOBAL WS DATA:", data);

//       if (data.type === "pong") {
//           console.log("📥 PONG RECEIVED"); // Если это есть — связь идеальна
//           return;
//       }

//       switch (data.type) {
//         // ================= ONLINE =================
//         case "online_status":
//           data.online
//             ? setOnline(data.user_id)
//             : setOffline(data.user_id);
//           break;

//         // ================= MESSAGES =================
//         case "delivered":
//           console.log("📦 DELIVERED:", data.message_id);
//           break;

//         case "product_message_delivered":
//           useProductStore.getState().markDelivered({
//             messageId: data.message_id,
//           });
//           break;

//         // ================= STORIES =================
//         case "story_created":
//           console.log("🟣 STORY CREATED", data.story_id);
//           useStoryFeedStore.getState().onStoryCreated();
//           break;

//         case "story_viewed":
//           // можно позже добавить обновление viewers
//             addStoryViewer(data.story_id, data.viewer);
//             console.log('data', data)
//           break;

//         case "story_deleted":
//           useStoryFeedStore.getState().onStoryDeleted(data);
//           break;
        
//        case "last_seen":
//         if (data.online) {
//           useOnlineStore.getState().setOnline(data.user_id);
//         } else {
//           useOnlineStore
//             .getState()
//             .setOffline(data.user_id, data.last_seen);
//         }
//         break;


//         default:
//           break;
//       }
//     };

//     ws.onerror = (e) => {
//       console.error("🌍 GLOBAL WS ERROR", e);
//     };

//     ws.onclose = () => {
//       console.warn("🌍 GLOBAL WS CLOSED", userId);
//       if (pingInterval.current) pingInterval.current = null;
//     };

//     return () => {
//       console.log("🧹 CLOSE WS", userId);
     
//       if (wsRef.current) {
//         wsRef.current.close();
//         wsRef.current = null;
//       }

//       if (pingInterval.current) clearInterval(pingInterval.current); // ГАРАНТИРОВАННАЯ ОЧИСТКА

//     };

//   }, [userId]); // ❗ ТОЛЬКО userId

//   return wsRef;
// }






// hooks/useGlobalSocket.js


// export default function useGlobalSocket(userId) {
//   // Храним ссылки, чтобы они не терялись при ререндере
//   const wsRef = useRef(null);
//   const pingIntervalRef = useRef(null);
//   const reconnectTimeoutRef = useRef(null);

//   const { setOnline, setOffline } = useOnlineStore();
//   const { setWsRef } = useAppStore();
//   const {addStoryViewer} = useStory()
  
//   // Функция подключения (вынесена, чтобы вызывать её повторно)
//   const connect = useCallback(() => {
//     const token = localStorage.getItem("access");
//     if (!userId || !token) return;

//     // Если уже есть открытое соединение — не открываем новое
//     if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
//        return; 
//     }

//     console.log("🔌 CONNECTING WS...", userId);
//     const ws = new WebSocket(`ws://localhost:8000/ws/user/?token=${token}`);
    
//     wsRef.current = ws;
//     setWsRef(ws);

//     ws.onopen = () => {
//       console.log("🌍 GLOBAL WS OPEN", userId);
      
//       // Сброс таймера реконнекта при успехе
//       if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//           reconnectTimeoutRef.current = null;
//       }

//       // Очистка старого пинга
//       if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

//       // Запуск пинга (20 сек надежнее для мобильных)
//       pingIntervalRef.current = setInterval(() => {
//         if (ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify({ type: "ping" }));
//           // console.log("📤 PING");
//         }
//       }, 800000); // лушче 20 наверно
//     };

//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       console.log("🌍 GLOBAL WS DATA:", data);

//       if (data.type === "pong") {
//           console.log("📥 PONG RECEIVED"); // Если это есть — связь идеальна
//           return;
//       }

//       switch (data.type) {
//         // ================= ONLINE =================
//         case "online_status":
//           data.online
//             ? setOnline(data.user_id)
//             : setOffline(data.user_id);
//           break;

//         // ================= MESSAGES =================
//         case "delivered":
//           console.log("📦 DELIVERED:", data.message_id);
//           break;

//         case "product_message_delivered":
//           useProductStore.getState().markDelivered({
//             messageId: data.message_id,
//           });
//           break;

//         // ================= STORIES =================
//         case "story_created":
//           console.log("🟣 STORY CREATED", data.story_id);
//           useStoryFeedStore.getState().onStoryCreated();
//           break;

//         case "story_viewed":
//           // можно позже добавить обновление viewers
//             addStoryViewer(data.story_id, data.viewer);
//             console.log('data', data)
//           break;

//         case "story_deleted":
//           useStoryFeedStore.getState().onStoryDeleted(data);
//           break;
        
//        case "last_seen":
//         if (data.online) {
//           useOnlineStore.getState().setOnline(data.user_id);
//         } else {
//           useOnlineStore
//             .getState()
//             .setOffline(data.user_id, data.last_seen);
//         }
//         break;


//         case "chat_update":
//           console.log("💬 CHAT UPDATE RECEIVED:", data.chat);
//           // Вызываем метод стора для обновления списка чатов
//           useMessageChatsStore.getState().updateChatFromSocket(data.chat);
//           break;
          
     

//         default:
//           break;
//       }
//     };

//     ws.onclose = (e) => {
//       console.warn("🌍 WS CLOSED. Code:", e.code);
      
//       // Очищаем интервал пинга
//       if (pingIntervalRef.current) {
//           clearInterval(pingIntervalRef.current);
//           pingIntervalRef.current = null;
//       }

//       // 🔥 АВТО-РЕКОННЕКТ
//       // Если закрытие не было инициировано нами (не при размонтировании)
//       if (wsRef.current) { 
//           console.log("🔄 TRYING TO RECONNECT IN 3s...");
//           reconnectTimeoutRef.current = setTimeout(() => {
//               connect();
//           }, 3000);
//       }
//     };

//     ws.onerror = (e) => {
//       console.error("🌍 WS ERROR", e);
//       ws.close(); // Это вызовет onclose и запустит реконнект
//     };

//   }, [userId, setOnline, setOffline, setWsRef]);

//   useEffect(() => {
//     connect();

//     // CLEANUP при размонтировании компонента (уход со страницы)
//     return () => {
//       console.log("🧹 UNMOUNT: Closing socket");
//       if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
//       if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
//       const ws = wsRef.current;
//       wsRef.current = null; // Обнуляем ref, чтобы onclose не триггерил реконнект
//       if (ws) ws.close();
//     };
//   }, [connect]);

//   return wsRef;
// }






export default function useGlobalSocket(userId) {
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const { setOnline, setOffline } = useOnlineStore();
  const { setWsRef } = useAppStore();
  
  // Берем методы из сторов напрямую, чтобы не вызывать их внутри useEffect лишний раз
  const onStoryCreated = useStoryFeedStore((s) => s.onStoryCreated);
  const onStoryDeleted = useStoryFeedStore((s) => s.onStoryDeleted);
  const markProductMsgDelivered = useProductStore((s) => s.markDelivered);
  const updateChatFromSocket = useMessageChatsStore((s) => s.updateChatFromSocket);
   const {addStoryViewer} = useStory()

  const connect = useCallback(() => {
    const token = localStorage.getItem("access");
    if (!userId || !token) return;

    // Защита от двойного подключения
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
       return; 
    }

    console.log("🔌 CONNECTING WS...", userId);
    // Убедись, что адрес правильный (ws vs wss для https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/user/?token=${token}`);
    
    wsRef.current = ws;
    setWsRef(ws);

    ws.onopen = () => {
      console.log("🌍 GLOBAL WS OPEN", userId);
      
      if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      // 🔥 ВАЖНО: Пинг каждые 30 секунд. 
      // 800000 мс (13 мин) — это слишком долго, сервер разорвет соединение раньше.
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 80000); 
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('data', data)
      if (data.type === "pong") return;

      switch (data.type) {
        // ================= ONLINE =================
        case "online_status":
          data.online ? setOnline(data.user_id) : setOffline(data.user_id);
          break;
        
        case "last_seen":
            if (data.online) {
                setOnline(data.user_id);
            } else {
                setOffline(data.user_id, data.last_seen);
            }
            break;

        // ================= MESSAGES =================
        case "delivered":
          // Логика галочек "прочитано/доставлено"
          break;

        case "product_message_delivered":
          markProductMsgDelivered({ messageId: data.message_id });
          break;

        // 🔥 ГЛАВНОЕ ОБНОВЛЕНИЕ: ЧАТЫ
        // Бэкенд прислал готовый объект чата (из services.py)
        case "chat_update":
          console.log("💬 CHAT UPDATE RECEIVED:", data.chat);
          updateChatFromSocket(data.chat); 
          break;

        // ================= STORIES =================
        case "story_created":
          console.log("🟣 STORY CREATED");
          onStoryCreated();
          break;

        case "story_viewed":
           // Логика просмотров сторис (если нужна в реальном времени)
           // useStoryFeedStore.getState().addViewer(...) 
              addStoryViewer(data.story_id, data.viewer);
              
           break;

        case "story_deleted":
          onStoryDeleted(data);
          break;

        default:
          break;
      }
    };

    ws.onclose = (e) => {
      console.warn("🌍 WS CLOSED. Code:", e.code);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      // Авто-реконнект, если компонент еще жив
      if (wsRef.current) { 
          console.log("🔄 RECONNECTING IN 3s...");
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (e) => {
      console.error("🌍 WS ERROR", e);
      ws.close();
    };

  }, [userId, setOnline, setOffline, setWsRef, onStoryCreated, onStoryDeleted, markProductMsgDelivered, updateChatFromSocket]);

  useEffect(() => {
    connect();

    return () => {
      console.log("🧹 UNMOUNT GLOBAL SOCKET");
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      const ws = wsRef.current;
      wsRef.current = null; // Блокируем реконнект
      if (ws) ws.close();
    };
  }, [connect]);

  return wsRef;
}