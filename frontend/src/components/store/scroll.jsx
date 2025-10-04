import {create} from 'zustand';

export const useScroll = create((set) => ({
    scrollY:0,
    setScrollY: (pos) => set({scrollY:pos}),

}))