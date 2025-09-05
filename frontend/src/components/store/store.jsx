import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../api/axios";

const useStore = create(
    persist(
        (set, get) => ({

            unreadRefresh:0,
            setUnreadRefresh: (count) => set({unreadRefresh:count}),

            enterChat:false,
            setEnterChat: (EnterChat) => set({EnterChat}),
          
            
            activeFilter: "all",
            setActiveFilter: (activeFilter) => set({ activeFilter }),
            messageFirst: false,
            setMessageFirst: (messageFirst) => set({ messageFirst }),
            

            user: null,
            setUser: (user) => set({ user }),

            // get isAuth() {
            //     return !!get().user;
            // }
            
             get isAuth() {
                return !!get().user && !!get().token;
            },

            login: (user, token) => set({ user, token}),
            logout: () => set({ user: null, token:null, unreadRefresh:0}),
        }),
        {
            name: "app-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token
               
            }),
        }
    )
);

export default useStore;
