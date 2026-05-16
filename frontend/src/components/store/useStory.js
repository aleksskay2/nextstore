// stores/storyStore.js
import { create } from "zustand";
import api from "../../api/axios";

export const useStory = create((set, get) => ({
  stories: [],
  isViewerOpen: false,
  startIndex: 0,

  // 👇 viewers
  storyViewers: {}, // { [storyId]: [] }
  viewersLoading: false,

  currentStoryId: null,   // <-- добавили

  loadStories: async () => {
    const res = await api.get("stories/mine");
    console.log('stories', res.data)

    const grouped = Object.values(
      res.data.reduce((acc, story) => {
        const uid = story.user.id;

        if (!acc[uid]) {
          acc[uid] = {
            user: story.user,
            stories: [],
          };
        }

        acc[uid].stories.push(story);
        return acc;
      }, {})
    );

    set({ stories: grouped });
  },

  loadStoryViewers: async (storyId) => {
    const { storyViewers } = get();

    // ❗ если уже загружены — не грузим снова
    if (storyViewers[storyId]) return;

    set({ viewersLoading: true });

    try {
      const res = await api.get(`/stories/${storyId}/viewers/`);
      set({
        storyViewers: {
          ...storyViewers,
          [storyId]: res.data,
        },
      });
    } catch (e) {
      console.error("Failed to load viewers", e);
    } finally {
      set({ viewersLoading: false });
    }
  },


  addStoryViewer: (storyId, viewer) => {
    const { storyViewers } = get();

    const current = storyViewers[storyId] || [];

    // ❗ защита от дублей
    if (current.some(v => v.id === viewer.id)) return;

    set({
      storyViewers: {
        ...storyViewers,
        [storyId]: [viewer, ...current],
      },
    });
  },



  openViewer: (index) =>
    set({
      isViewerOpen: true,
      startIndex: index,
      currentStoryId: null,   // сброс при открытии
    }),

  closeViewer: () =>
    set({
      isViewerOpen: false,
      currentStoryId: null,   // сброс при открытии
    }),

    setCurrentStoryId: (id) =>
    set({ currentStoryId: id }),

}));
