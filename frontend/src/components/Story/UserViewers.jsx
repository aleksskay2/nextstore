import { useEffect, useState } from "react";
import api from "../../api/axios";
import styles from "./UserViewers.module.css";
import { useStory } from "../store/useStory";





export default function UserViewers({ storyId, onClose }) {
  const {
    storyViewers,
    loadStoryViewers,
    viewersLoading,
  } = useStory();

  useEffect(() => {
    loadStoryViewers(storyId);
    console.log(storyViewers)
  }, [storyId]);

  const viewers = storyViewers[storyId] || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Просмотрели</h3>
          <span className={styles.count}>{viewers.length}</span>
        </div>

        {viewersLoading ? (
          <div className={styles.loader}>Загрузка…</div>
        ) : viewers.length === 0 ? (
          <div className={styles.empty}>
            Никто ещё не посмотрел сторис
          </div>
        ) : (
          <ul className={styles.viewersList}>
            {viewers.map((v) => (
              <li key={v.id} className={styles.viewerItem}>
                <img
                  src={v.avatar || "/default-avatar.png"}
                  alt={v.username}
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <span className={styles.username}>
                    {v.username}
                  </span>
                  {v.viewed_at && (
                    <span className={styles.time}>
                      {new Date(v.viewed_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
