import {create} from 'zustand';

export const useUiStore = create ((set) => ({
    acitveTab:'chat',
    setActiveTab:(tab) => set({activeTab:tab}),
}))