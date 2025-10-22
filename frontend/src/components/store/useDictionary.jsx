// stores/useDictionaryStore.js
import { create } from "zustand";
import api from "../../api/axios";

const useDictionary = create ((set, get) =>( {
	categories :[],
	regions:[],

	isLoadingCategeries:false,
	isLoadingRegions:false,

	errorCategories:null,
	errorRegions:null,

	fetchCategories:async () => {
		if (get().categories.length > 0) return;
		set({isLoadingCategeries:true, errorCategories:null});

		try {
			const res = await api.get('/categories/')
			set({categories:res.data, isLoadingCategeries:false});
			console.log('category in UseDic', res.data)
		}
		catch(error) {
			set({errorCategories:error.message, isLoadingCategeries:false})
		}
	}
	,
	fetchRegions:async () => {
		if (get().regions.length > 0) return;
		set({isLoadingRegions:true, errorRegions:null});

		try {
			const res = await api.get('/regions/')
			set({regions:res.data, isLoadingRegions:false});
		}
		catch(error) {
			set({errorRegions:error.message, isLoadingRegions:false})
		}
	},

	clerDictionaries:() => {
		set ({
			categories :[],
			regions:[],

			isLoadingCategeries:false,
			isLoadingRegions:false,

			errorCategories:null,
			errorRegions:null,
		})
	}

}))

export default useDictionary;