import api from "./axios";

export const fetchChatSummary = () =>
  api.get("chats-summary");