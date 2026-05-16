import { create } from "zustand";
import api from "../../api/axios";

export const useFollowStore = create((set) => ({
  followersCount: 0,
  followingCount: 0,
  isFollowing: false,
  loading: false,

  loadUserStats: async (userId) => {
    const res = await api.get(`follows/stats/${userId}`);
    set({
      followersCount: res.data.followers_count,
      followingCount: res.data.following_count,
      isFollowing: res.data.is_following,
    });
  },

  follow: async (userId) => {
    set({ loading: true });
    await api.post(`/follows/follow/${userId}/`);
    set((state) => ({
      isFollowing: true,
      followersCount: state.followersCount + 1,
      loading: false,
    }));
  },

  unfollow: async (userId) => {
    set({ loading: true });
    await api.post(`/follows/unfollow/${userId}/`);
    set((state) => ({
      isFollowing: false,
      followersCount: Math.max(0, state.followersCount - 1),
      loading: false,
    }));
  },
}));
