// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import api from "../../api/axios";

// export const useProductFilter = create(
//   persist(
//     (set, get) => ({
//       // ----------- Фильтры -----------
//       search: "",
//       category: "",
//       region: "",
//       sortBy: "price",
//       minPrice: "",
//       maxPrice: "",
//       pageUrl: null,
//       type:'all',
//       nextUrl:null,
//       products:[],
//       loading:false,


//       setSearch: (s) => set({ search: s }),
//       setCategory: (c) => set({ category: c }),
//       setRegion: (r) => set({ region: r }),
//       setSortBy: (s) => set({ sortBy: s }),
//       setMinPrice: (v) => set({ minPrice: v }),
//       setMaxPrice: (v) => set({ maxPrice: v }),
//       setPageUrl: (url) => set({ pageUrl: url }),
//       setType: (v) => set({ type: v }),
//       setNextUrl: (url) => set({ nextUrl: url }),
      




//       toggleSortPrice: () =>
//       set((state) => ({
//         sortBy: state.sortBy ='price'
//       })),

//       // ----------- URL для запроса -----------
//       buildUrl: () => {
//         const { search, category, region, sortBy, minPrice, maxPrice, type } = get();
//         const params = new URLSearchParams();
//         params.append('type', type)

//         if (search) params.append("search", search);
//         if (category) params.append("category", category);
//         if (region) params.append("region", region);
//         if (minPrice) params.append("min_price", minPrice);
//         if (maxPrice) params.append("max_price", maxPrice);
//         if (sortBy) {
//           const order = sortBy === "product_rating" ? `${sortBy}` : sortBy;
//           params.append("ordering", order);
//         }

//         return `/products/?${params.toString()}`;
//       },


//       fetchProducts: async (append = false) => {
//         try {
//           const { buildUrl, nextUrl } = get();

//           const finalUrl = append && nextUrl ? nextUrl : buildUrl();

//           set({ loading: true });

//           const res = await api.get(finalUrl);

//           set((state) => ({
//             products: append
//               ? [...state.products, ...res.data.results]
//               : res.data.results,
//             nextUrl: res.data.next,
//           }));
//         } catch (e) {
//           console.error("Ошибка при загрузке продуктов:", e);
//         } finally {
//           set({ loading: false });
//         }
//       },

    



//      // ------------ ПРОВЕРКА ИЗБРАННОГО ------------
//       isBookmarked: (id) => {
//         return get().bookmarks[id] === true;
//       },

//       // ------------ ДОБАВИТЬ / УДАЛИТЬ ИЗБРАННОЕ ------------
//       toggleBookmark: async (productId) => {
//         const isFav = get().isBookmarked(productId);

//         // Оптимистично обновляем UI
//         set((state) => ({
//           bookmarks: {
//             ...state.bookmarks,
//             [productId]: !isFav,
//           },
//         }));


//         try {
//           const token = localStorage.getItem("access");
//           if (!token) {
//             alert("Только авторизованные пользователи могут добавлять в избранное");
//             return;
//           }

//           if (isFav) {
//             // ---------- УДАЛЕНИЕ ----------
//             await api.delete(`/bookmarks/remove${productId}/`);
//           } else {
//             // ---------- ДОБАВЛЕНИЕ ----------
//             await api.post("/bookmarks/add/", { product: productId });
//           }
//         } catch (error) {
//           console.error("Ошибка при обновлении закладок:", error);

//           // откатываем состояние при ошибке
//           set((state) => ({
//             bookmarks: {
//               ...state.bookmarks,
//               [productId]: isFav,
//             },
//           }));
        
//         },
    

//     {
//       name: "product-filters", // ключ для локального хранения
//     }
//   )
// );




         

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../api/axios";

export const useProductFilter = create(
  persist(
    (set, get) => ({
      // ----------- Фильтры -----------
      search: "",
      category: "",
      region: "",
      sortBy: "price",
      minPrice: "",
      maxPrice: "",
      type: "all",

      pageUrl: null,
      nextUrl: null,

      // ----------- Данные -----------
      products: [],
      loading: false,

      // ----------- Избранное -----------
      bookmarks: {}, // { productId: true }

      // ----------- Сеттеры фильтров -----------
      setSearch: (v) => set({ search: v }),
      setCategory: (v) => set({ category: v }),
      setRegion: (v) => set({ region: v }),
      setSortBy: (v) => set({ sortBy: v }),
      setMinPrice: (v) => set({ minPrice: v }),
      setMaxPrice: (v) => set({ maxPrice: v }),
      setPageUrl: (v) => set({ pageUrl: v }),
      setType: (v) => set({ type: v }),
      setNextUrl: (v) => set({ nextUrl: v }),

      toggleSortPrice: () =>
        set(() => ({
          sortBy: "price",
        })),

      // ----------- Построение URL -----------
      buildUrl: () => {
        const { search, category, region, sortBy, minPrice, maxPrice, type } = get();
        const params = new URLSearchParams();

        params.append("type", type);
        if (search) params.append("search", search);
        if (category) params.append("category", category);
        if (region) params.append("region", region);
        if (minPrice) params.append("min_price", minPrice);
        if (maxPrice) params.append("max_price", maxPrice);

        if (sortBy) {
          const order = sortBy === "product_rating" ? sortBy : sortBy;
          params.append("ordering", order);
        }

        return `/products/?${params.toString()}`;
      },

      // ----------- Загрузка товаров -----------
      fetchProducts: async (append = false) => {
        try {
          const { buildUrl, nextUrl } = get();
          const finalUrl = append && nextUrl ? nextUrl : buildUrl();

          set({ loading: true });

          const res = await api.get(finalUrl);
          // console.log('res in UseProductFilter', res.data)

          set((state) => ({
            products: append
              ? [...state.products, ...res.data.results]
              : res.data.results,
            nextUrl: res.data.next,
          }));
        } catch (e) {
          console.error("Ошибка загрузки продуктов:", e);
        } finally {
          set({ loading: false });
        }
      },


      /* ...твой код... */

      deleteProduct: async (id) => {
        try {
          await api.delete(`delete-user-product/${id}`);

          set((state) => ({
            products: state.products.filter((prod) => prod.id !== id)
          }));

        } catch (error) {
          console.error("Ошибка удаления товара:", error);
        }
      },



          // ----------- Счетчики непрочитанных сообщений -----------
    unread_private: 0,
    unread_product: 0,
    total_unread: 0,

    fetchTotalUnread: async () => {
      try {
        const res = await api.get("private-chat/unread-total/");

        set({
          unread_private: res.data.private_unread,
          unread_product: res.data.product_unread,
          total_unread: res.data.total_unread
        });

      } catch (e) {
        console.error("Ошибка загрузки количества непрочитанных сообщений:", e);
      }
    },


      // ----------- Загрузка избранного с сервера -----------
      loadBookmarksFromServer: async () => {
        try {
          const token = localStorage.getItem("access");
          if (!token) return;

          const res = await api.get("/bookmarks/");

          const map = {};
          res.data.forEach((b) => {
            map[b.product.id] = true;
          });

          set({ bookmarks: map });
        } catch (e) {
          console.error("Ошибка загрузки избранного:", e);
        }
      },

      // ----------- Проверка избранного -----------
      isBookmarked: (id) => {
        return get().bookmarks[id] === true;
      },

      // ----------- ДОБАВИТЬ / УДАЛИТЬ ИЗБРАННОЕ -----------
     

      toggleBookmark: async (productId) => {
    const state = get();
    const products = state.products;
    const index = products.findIndex(p => p.id === productId);

    if (index === -1) return; // нет продукта

    const oldValue = products[index].is_bookmark;
    const newValue = !oldValue;

    // ---- 1️⃣  Оптимистичное обновление products ----
    set({
        products: products.map(p =>
            p.id === productId ? { ...p, is_bookmark: newValue } : p
        )
    });

    try {
        const token = localStorage.getItem("access");
        if (!token) {
            alert("Авторизуйтесь, чтобы добавлять в избранное");
            return;
        }

        if (oldValue) {
            await api.delete(`/bookmarks/remove/${productId}/`);
        } else {
            await api.post(`/bookmarks/add/`, { product: productId });
        }

    } catch (err) {
        console.error("Ошибка изменения избранного:", err);

        // ---- 2️⃣  Откат на старое значение при ошибке ----
        set({
            products: products.map(p =>
                p.id === productId ? { ...p, is_bookmark: oldValue } : p
            )
        });
    }
},


      
    }),

    {
      name: "product-filters", // localStorage key
    }
  )
);
