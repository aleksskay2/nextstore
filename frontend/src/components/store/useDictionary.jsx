// stores/useDictionaryStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../api/axios";

const useDictionary = create(
  
    (set, get) => ({
      categories: [],
      regions: [],

      isLoadingCategories: false,
      isLoadingRegions: false,

      errorCategories: null,
      errorRegions: null,

      // --- Fetch CATEGORIES ---
      fetchCategories: async () => {
        if (get().categories.length > 0) return; // cached

        set({ isLoadingCategories: true, errorCategories: null });

        try {
          const res = await api.get("/categories/");
          set({
            categories: res.data,
            isLoadingCategories: false,
          });
        } catch (error) {
          set({
            errorCategories: error.message,
            isLoadingCategories: false,
          });
        }
      },

      // --- Fetch REGIONS ---
      fetchRegions: async () => {
        if (get().regions.length > 0) return; // cached

        set({ isLoadingRegions: true, errorRegions: null });

        try {
          const res = await api.get("/regions/");
          set({
            regions: res.data,
            isLoadingRegions: false,
          });
        } catch (error) {
          set({
            errorRegions: error.message,
            isLoadingRegions: false,
          });
        }
      },

      // --- Clear store (optional) ---
      clearDictionaries: () =>
        set({
          categories: [],
          regions: [],
          isLoadingCategories: false,
          isLoadingRegions: false,
          errorCategories: null,
          errorRegions: null,
        }),
    }),

    {
      name: "dictionary-cache", // localStorage key
    }
  
);

export default useDictionary;