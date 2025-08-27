import {create} from 'zustand'

const useStore = create((set) => ({
    activeFilter:'all',
    setActiveFilter:(activeFilter) => set({activeFilter})
}))

export default useStore;