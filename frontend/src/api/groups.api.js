import api from "./axios";

export const getGroups = () =>
  api.get("/groups/");

export const getGroupDetail = (groupId) =>
  api.get(`/groups/${groupId}/`);

// ИСПРАВЛЕНО: Добавлены заголовки для поддержки FormData
export const createGroup = (data) =>
  api.post("/groups/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Вступить в публичную группу (обычно POST без тела или с пустым телом)
export const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join/`);

// Добавить участника (тут обычно JSON, так как нет файлов)
export const addGroupMember = (groupId, userId) =>
  api.post(`/groups/${groupId}/add_member/`, { user_id: userId });

export const updateGroup = (groupId, data) => {
  return api.patch(`/groups/${groupId}/`, data, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};