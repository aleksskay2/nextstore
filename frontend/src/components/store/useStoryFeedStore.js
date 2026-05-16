// stores/useStoryFeedStore.js
import { create } from "zustand";
import api from "../../api/axios";

// export const useStoryFeedStore = create((set, get) => ({
//   // ===== FEED =====
//   stories: [], // [{ user, stories: [] }]
//   loadingFeed: false,

//   // ===== VIEWER STATE =====
//   isViewerOpen: false,
//   startIndex: 0,

//   loadStories: async () => {
//     set({ loadingFeed: true });
//     try {
//       const res = await api.get("/stories/"); // только подписки
//       console.log("stories feed", res.data);

//       const grouped = Object.values(
//         res.data.reduce((acc, story) => {
//           const uid = story.user.id;

//           if (!acc[uid]) {
//             acc[uid] = {
//               user: story.user,
//               stories: [],
//             };
//           }

//           acc[uid].stories.push(story);
//           return acc;
//         }, {})
//       );

//       set({
//         stories: grouped,
//         loadingFeed: false,
//       });
//     } catch (e) {
//       console.error("Ошибка загрузки сторис", e);
//       set({ loadingFeed: false });
//     }
//   },


//    // 🔥 handler для WS
//   onStoryCreated: () => {
//     get().loadStories();
//   },


//    // 🔥 удаление сториса
//   onStoryDeleted: ({ story_id, author_id }) => {
//     const { stories } = get();

//     const updated = stories
//       .map(group => {
//         if (group.user.id !== author_id) return group;

//         const filteredStories = group.stories.filter(
//           s => s.id !== story_id
//         );

//         // если у пользователя больше нет сторис — убираем группу
//         if (filteredStories.length === 0) return null;

//         return {
//           ...group,
//           stories: filteredStories,
//         };
//       })
//       .filter(Boolean);

//     set({ stories: updated });
//   },



//   // ===== VIEWER CONTROLS =====
//   openViewer: (index) =>
//     set({
//       isViewerOpen: true,
//       startIndex: index,
//     }),

//   closeViewer: () =>
//     set({
//       isViewerOpen: false,
//     }),
// }));








export const useStoryFeedStore = create((set, get) => ({
  stories: [],
  loadingFeed: false,

  isViewerOpen: false,
  startIndex: 0,

  loadStories: async () => {
    set({ loadingFeed: true });
    try {
      const res = await api.get("/stories/");
      const data = res.data;

      // 1) группируем по пользователю
      const grouped = Object.values(
        data.reduce((acc, story) => {
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

      // 2) сортируем сторис внутри группы по времени
      grouped.forEach(group => {
        group.stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });

      // 3) сортируем группы:
      //  - сначала те, где есть непросмотренные
      //  - затем по последней дате сторис
      grouped.sort((a, b) => {
        const aHasUnviewed = a.stories.some(s => !s.is_viewed);
        const bHasUnviewed = b.stories.some(s => !s.is_viewed);

        if (aHasUnviewed !== bHasUnviewed) {
          return aHasUnviewed ? -1 : 1;
        }

        const aLast = new Date(a.stories[0].created_at);
        const bLast = new Date(b.stories[0].created_at);

        return bLast - aLast;
      });

      set({
        stories: grouped,
        loadingFeed: false,
      });
    } catch (e) {
      console.error("Ошибка загрузки сторис", e);
      set({ loadingFeed: false });
    }
  },

  onStoryCreated: () => {
    get().loadStories();
  },

  onStoryDeleted: ({ story_id, author_id }) => {
    const { stories } = get();

    const updated = stories
      .map(group => {
        if (group.user.id !== author_id) return group;

        const filteredStories = group.stories.filter(
          s => s.id !== story_id
        );

        if (filteredStories.length === 0) return null;

        return {
          ...group,
          stories: filteredStories,
        };
      })
      .filter(Boolean);

    set({ stories: updated });
  },


    markStoryViewed: (storyId) => {
    const { stories } = get();

    const updated = stories.map(group => ({
      ...group,
      stories: group.stories.map(story =>
        story.id === storyId
          ? { ...story, is_viewed: true }
          : story
      ),
    }));

    set({ stories: updated });
  },


  openViewer: (index) =>
    set({
      isViewerOpen: true,
      startIndex: index,
    }),

  closeViewer: () =>
    set({
      isViewerOpen: false,
    }),
}));
