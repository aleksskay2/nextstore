import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./UserProfilePage.module.css";
import { useUserProfileStore } from "../../components/store/useUserProfileStore";
import ProductItem from "../Product/ProductItem";

import { useStory } from "../../components/store/useStory";
import { useFollowStore } from "../../components/store/useFollowStore";

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { user, products, loading, loadUserProfile } = useUserProfileStore();

  const {
    followersCount,
    followingCount,
    isFollowing,
    loadUserStats,
    follow,
    unfollow,
    followLoading,
  } = useFollowStore();

  // Загружаем (или берём из кэша)
  useEffect(() => {
    loadUserProfile(userId);
  }, [userId]);

  useEffect(() => {
    loadUserStats(userId);
  }, [userId]);

  useEffect(() => {
    loadStories();
    console.log("sdf");
  }, []);

  const loadStories = useStory((s) => s.loadStories);
  const stories = useStory((s) => s.stories);
  const openViewer = useStory((s) => s.openViewer);

  const userStoriesIndex = stories.findIndex(
    (group) => group.user.id === parseInt(userId),
  );

  const hasStories = userStoriesIndex !== -1;

  const handleAvatarClick = () => {
    // ждём, пока сторис загрузятся
    // alert('asfd')
    if (!stories || stories.length === 0) {
      console.log("Сторис ещё не загружены");
    }

    if (hasStories) {
      openViewer(userStoriesIndex);
    } else {
    }
    navigate("/create-story");
  };

  if (loading || !user) return <div className={styles.loading}>Загрузка…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.page__container}>
        <header className={styles.topSection}>
          {/* Аватар с индикатором сторис */}
          <div
            className={`${styles.avatarWrapper} ${hasStories ? styles.hasStory : ""}`}
            onClick={handleAvatarClick}
          >
            <div className={styles.avatarInner}>
              <img
                src={user.avatar || "/default-avatar.png"}
                alt="user avatar"
                className={styles.avatar}
              />
            </div>
          </div>

          {/* Блок информации */}
          <div className={styles.infoBlock}>
            <h2 className={styles.username}>{user.username}</h2>
            <div className={styles.usernameRow}>
              <div className={styles.actionButtons}>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.messageBtn}
                    onClick={() => navigate(`/chat/private/${user.id}`)}
                  >
                    Сообщение
                  </button>

                  {user.id !== userId && (
                    <button
                      className={
                        isFollowing ? styles.unfollowBtn : styles.followBtn
                      }
                      disabled={followLoading}
                      onClick={() =>
                        isFollowing ? unfollow(userId) : follow(userId)
                      }
                    >
                      {isFollowing ? "Отписаться" : "Подписаться"}
                    </button>
                  )}

                  <button
                    className={styles.settingsBtn}
                    onClick={() => navigate(`/user/${userId}/edit`)}
                    title="Настройки"
                  >
                    Настройки
                  </button>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className={styles.counters}>
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>{products.length}</span>
                <span className={styles.counterLabel}>товаров</span>
              </div>
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>{followersCount}</span>
                <span className={styles.counterLabel}>подписчиков</span>
              </div>
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>{followingCount}</span>
                <span className={styles.counterLabel}>подписок</span>
              </div>
            </div>

            {/* Детали профиля */}
            <div className={styles.details}>
              <p className={styles.bioName}>
                {user.full_name || user.username}
              </p>
              <div className={styles.detailsGrid}>
                {user.region && <p>📍 {user.region}</p>}
                {user.phone && <p>📞 {user.phone}</p>}
                {user.email && <p>✉️ {user.email}</p>}
              </div>
            </div>
          </div>
        </header>

        <div className={styles.divider}></div>

        {/* Сетка товаров */}
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
