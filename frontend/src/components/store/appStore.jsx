// import { create } from "zustand";
// import api from "../../api/axios";


// export const useAppStore = create((set, get) => ({
//   user: null,
//   isLoadingUser: false,
//   isUserLoaded: false,

//   fetchUser: async () => {
//     const access = localStorage.getItem("access");

//     // ❗ если токена нет — сразу считаем, что пользователь загружен
//     if (!access) {
//       set({ user: null, isUserLoaded: true });
//       return;
//     }

//     // ❗ защита от повторных вызовов
//     if (get().isLoadingUser || get().isUserLoaded) return;

//     try {
//       set({ isLoadingUser: true });

//       const res = await api.get("/user/");
//       set({
//         user: res.data,
//         isUserLoaded: true,
//         isLoadingUser: false,
//       });
//     } catch (e) {
//       // ❗ токен битый / истёк
//       localStorage.removeItem("access");
//       localStorage.removeItem("refresh");

//       set({
//         user: null,
//         isUserLoaded: true,
//         isLoadingUser: false,
//       });
//     }
//   },

//   logout: () => {
//     localStorage.removeItem("access");
//     localStorage.removeItem("refresh");

//     set({
//       user: null,
//       isUserLoaded: false,
//     });
//   },
// }));





import { create } from "zustand";
import api from "../../api/axios";

export const useAppStore = create((set, get) => ({
  user: null,          // { id, username, ... }
  isLoadingUser: false,
  isUserLoaded: false,

  wsRef: null, // сюда положим глобальный WS

  // 🎯 Новое состояние для режима навигации
  navbarMode: 'default', // 'default' или 'messages'

  setNavbarMode: (mode) => set({ navbarMode: mode }),
  

  fetchUser: async () => {
  const access = localStorage.getItem("access");
  const { isUserLoaded } = get();

  if (!access || isUserLoaded) return;

  try {
    set({ isLoadingUser: true });

    const res = await api.get("/user/");
    console.log('res', res.data)
    set({
      user: res.data,
      isUserLoaded: true,
      isLoadingUser: false,
    });
  } catch (e) {
    set({
      user: null,
      isUserLoaded: true,
      isLoadingUser: false,
    });
  }
},


   setWsRef: (ws) => set({ wsRef: ws }),

   // 🎯 Метод для закрытия WebSocket
  closeWebSocket: () => {
    const { wsRef } = get();
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.close();
      console.log("✅ Сокет закрыт!");
    }
  },

  logout: () => {
    const { closeWebSocket } = get();

  closeWebSocket(); // 🔥 ВАЖНО
    set({
      user: null,
      isUserLoaded: false,
    });
  },
}));