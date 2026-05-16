// stores/onlineStore.js
import { create } from "zustand";

// export const useOnlineStore = create((set) => ({
//   onlineUsers: new Set(),
  

//   setOnline: (userId) =>
//     set((state) => {
//       const next = new Set(state.onlineUsers);
//       next.add(Number(userId));
//       return { onlineUsers: next };
//     }),

//   setOffline: (userId) =>
//     set((state) => {
//       const next = new Set(state.onlineUsers);
//       next.delete(Number(userId));
//       return { onlineUsers: next };
//     }),

//     clearOnline: () => set({ onlineUsers: new Set() }),
// }));



export const useOnlineStore = create((set) => ({
  onlineUsers: new Set(),
  lastSeen: {}, // { [userId]: timestamp }

  setOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(Number(userId));

      // если стал онлайн — last_seen больше не нужен
      const nextLastSeen = { ...state.lastSeen };
      delete nextLastSeen[userId];

      return {
        onlineUsers: next,
        lastSeen: nextLastSeen,
      };
    }),

  setOffline: (userId, lastSeenTs = null) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(Number(userId));

      return {
        onlineUsers: next,
        lastSeen: lastSeenTs
          ? { ...state.lastSeen, [userId]: lastSeenTs }
          : state.lastSeen,
      };
    }),

  clearOnline: () =>
    set({
      onlineUsers: new Set(),
      lastSeen: {},
    }),
}));
