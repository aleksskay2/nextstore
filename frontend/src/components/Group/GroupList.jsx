

import { useEffect, useState } from "react";
import { getGroups } from "../../api/groups.api"

import { createGroup } from "../../api/groups.api";
import { useGroupsStore } from "../store/groups.store";
import styles from "./GroupList.module.css";

export default function GroupList() {
  const { groups, setGroups, setActiveGroup } = useGroupsStore();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);



      const handleCreateGroup = async () => {
      if (!newTitle.trim()) return;

      // 1. Создаем объект FormData вместо обычного объекта {}
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("description", newDescription);
      formData.append("is_private", isPrivate); // В FormData булево значение станет строкой "true"/"false"

      try {
        // 2. Передаем formData в функцию запроса
        const res = await createGroup(formData);

        // ВАЖНО: res.data — это то, что вернул сервер. 
        // Убедись, что бэкенд возвращает созданный объект группы.
        setGroups([...groups, res.data]);
        
        setNewTitle("");
        setNewDescription("");
        setIsPrivate(false);
      } catch (err) {
        console.error("Ошибка создания группы:", err);
      }
    };


  useEffect(() => {
  getGroups()
    .then((res) => {
      console.log("GROUPS:", res.data);
      setGroups(res.data);
    })
    .catch((err) => {
      console.error("Ошибка загрузки групп:", err);
    });
    
}, []);


  return (
    <div className={styles["create-group"]}>
      <div className={styles["create-group__content"]}>
        
        {/* Название */}
        <div className={styles["create-group__item"]}>
          <input
            type="text"
            placeholder="Название группы"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full mb-2 border p-1 rounded"
          />
        </div>

        {/* Описание */}
        <div className={styles["create-group__item"]}>
          <input
            type="text"
            placeholder="Описание (не обязательно)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full mb-2 border p-1 rounded"
          />
        </div>

        {/* Приватность */}
        <div
          className={styles["create-group__item"]}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            type="checkbox"
            id="privateGroup"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <label htmlFor="privateGroup">
            Приватная группа
          </label>
        </div>

        {/* Кнопка */}
        <div className={styles["create-group__item"]}>
          <button
            onClick={handleCreateGroup}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Создать группу
          </button>
        </div>
      </div>

      {/* Список групп */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((g) => (
          <div
            key={g.id}
            onClick={() => setActiveGroup(g)}
            className="p-3 cursor-pointer hover:bg-gray-100"
          >
            <div className="font-semibold">
              {g.title}
              {g.is_private && " 🔒"}
            </div>
            <div className="text-sm text-gray-500">
              {g.last_message?.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
