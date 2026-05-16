import { create } from "zustand";
import api from "../../api/axios";


export const useUserProfileStore = create((set, get) => ({
    cache: {},
    loading: false,
    error: null,

    user: null,
    products: [],

    /** Синхронная загрузка из кэша */
    loadFromCache: (userId) => {
        const cache = get().cache[userId];
        if (!cache) return false;

        set({
            user: cache.user,
            products: cache.products,
            loading: false
        });

        return true;
    },

    /** Асинхронная загрузка с сервера */
    loadUserProfile: async (userId, force = false) => {
        const cache = get().cache[userId];

        if (cache && !force) {
            set({
                user: cache.user,
                products: cache.products,
                loading: false,
            });
            return;
        }

        try {
            set({ loading: true });

            const res = await api.get(`/users/${userId}/full-profile/`);
            // console.log('res', res.data)

            const data = {
                user: res.data.user,
                products: res.data.products,
                loadedAt: Date.now(),
            };

            set((state) => ({
                user: data.user,
                products: data.products,
                cache: {
                    ...state.cache,
                    [userId]: data
                },
                loading: false,
            }));

        } catch (error) {
            console.error('Ошибка получения профиля', error)
            set({ error: error, loading: false });
            
        }
    }
}));