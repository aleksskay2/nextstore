import { useEffect, useState , useRef} from "react";
import { useNavigate } from "react-router-dom";
import api from '../../api/axios'
import StoryProgress from "./StoryProgress";
import styles from './StoriesViewer.module.css'

// // components/StoriesViewer.jsx
import { useStory } from "../store/useStory";
import CreateStory from "./CreateStory";
import UserViewers from "./UserViewers";
import { useAppStore } from "../store/appStore";
const IMAGE_DURATION = 300000;







export default function StoriesViewer() {
  const {
    stories,
    startIndex,
    isViewerOpen,
    closeViewer,
    storyViewers,
    loadStoryViewers,
    setCurrentStoryId
  } = useStory();


  const [userIndex, setUserIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const progressRefs = useRef([]);

  useEffect(() => {
    if (!isViewerOpen) return;
    setUserIndex(startIndex ?? 0);
    setStoryIndex(0);
    setCurrentStoryId(current.id);
    console.log('currentUserGroup', currentUserGroup)  
  }, [isViewerOpen, startIndex]);

  const currentUserGroup = stories[userIndex];
  const current = currentUserGroup?.stories?.[storyIndex];



  const currentStory =
    stories[userIndex]?.stories[storyIndex];

  const viewersCount =
    storyViewers[currentStory?.id]?.length || 0;


  const user = useAppStore(s => s.user); // подписка на store
    

  // Mark viewed

  useEffect(() => {
    if (!isViewerOpen || !current) return;

    // Если это не твоя сторис
    console.log('user - ', user )
    if (currentUserGroup.user.id !== user.id) {
      api.post(`stories/${current.id}/view/`).catch(() => {});
    }
  }, [current?.id, isViewerOpen]);


  // Navigation
  const next = () => {
    if (!currentUserGroup) return;
    if (storyIndex < currentUserGroup.stories.length - 1) {
      setStoryIndex((s) => s + 1);
    } else if (userIndex < stories.length - 1) {
      setUserIndex((u) => u + 1);
      setStoryIndex(0);
    } else {
      closeViewer();
    }
  };

  const prev = () => {
    if (storyIndex > 0) setStoryIndex((s) => s - 1);
  };

  // Auto-next
  useEffect(() => {
    if (!isViewerOpen || !current) return;
    if (current.media.endsWith(".mp4")) return;

    const t = setTimeout(next, IMAGE_DURATION);
    return () => clearTimeout(t);
  }, [storyIndex, userIndex, current?.media, isViewerOpen]);

  // Animate progress bars
  useEffect(() => {
    if (!isViewerOpen || !current) return;
    progressRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = "none";
      el.style.width = i < storyIndex ? "100%" : "0%";
      if (i === storyIndex) {
        requestAnimationFrame(() => {
          el.style.transition = `width ${IMAGE_DURATION}ms linear`;
          el.style.width = "100%";
        });
      }
    });
  }, [storyIndex, isViewerOpen]);

  
  useEffect(() => {
    if (currentStory?.id) {
      loadStoryViewers(currentStory.id);
    }
  }, [currentStory?.id]);

 
  const deleteStory = async () => {
     
    alert('sadf')
    await api.delete(`/stories/${current.id}/delete/`);
    closeViewer(); // закроем viewer
        
  }


if (!isViewerOpen || !currentUserGroup || !current || !user) {
  return null;
}

 const isOwner = currentUserGroup.user.id === user.id;



return (
    <div className={styles["stories-viewer"]}>
      {/* Весь контент внутри этого блока для правильного позиционирования */}
      <div className={styles["story-content"]}>
        
        {/* Progress Bars */}
        <div className={styles["story-progress"]}>
          {currentUserGroup.stories.map((_, i) => (
            <div key={i} className="bar">
              <div ref={(el) => (progressRefs.current[i] = el)} className="fill" />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className={styles["story-header"]}>
          <div className={styles["story-header__avatar"]}>
            <img src={currentUserGroup.user.avatar || "/default-avatar.png"} alt="avatar" />
          </div>
          <span>{currentUserGroup.user.username}</span>

          <div className={styles.viewers}>
            <button className={styles.viewersBtn} onClick={() => setShowViewers(true)}>
              <span role="img" aria-label="viewers">👁</span> {viewersCount}
            </button>
          </div>
        </div>

        {/* Media */}
        {current.media.endsWith(".mp4") ? (
          <video src={current.media} autoPlay onEnded={next} playsInline />
        ) : (
          <img src={current.media} alt="story" />
        )}

        {/* Click Areas */}
        <div className={`${styles.storyClick} ${styles.left}`} onClick={prev} />
        <div className={`${styles.storyClick} ${styles.right}`} onClick={next} />

        {/* Close Button */}
        <button className={styles["close"]} onClick={closeViewer}>✕</button>
      </div>

      {/* Модалка просмотров рендерится поверх всего */}
      {showViewers && (
        <UserViewers
          storyId={current.id}
          onClose={() => setShowViewers(false)}
        />
      )}
    </div>
  );
}