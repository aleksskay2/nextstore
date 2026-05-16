import { useEffect, useState } from "react";
import api from "../../api/axios";

// import styles from './CreateStory.module.css'
import { useStory } from "../store/useStory";




// const MAX_VIDEO_SIZE_MB = 50;

// export default function CreateStory({ onSuccess }) {

//   const currentStoryId = useStory((s) => s.currentStoryId);

//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // ----------------------------
//   // File select
//   // ----------------------------
//   const handleSelect = (e) => {
//     const f = e.target.files[0];
//     if (!f) return;

//     // type check
//     if (!f.type.startsWith("image") && !f.type.startsWith("video")) {
//       setError("Можно загрузить только фото или видео");
//       return;
//     }

//     // video size check
//     if (f.type.startsWith("video")) {
//       const sizeMB = f.size / (1024 * 1024);
//       if (sizeMB > MAX_VIDEO_SIZE_MB) {
//         setError(`Видео не должно превышать ${MAX_VIDEO_SIZE_MB}MB`);
//         return;
//       }
//     }

//     setError("");
//     setFile(f);
//     setPreview(URL.createObjectURL(f));
//   };

//   // ----------------------------
//   // Upload
//   // ----------------------------
//   const handleUpload = async () => {
//     if (!file) return;

//     setLoading(true);
//     setError("");

//     const formData = new FormData();
//     formData.append("media", file);

//     try {
//       await api.post("/stories/", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       setFile(null);
//       setPreview(null);
//       onSuccess?.();
//     } catch (err) {
//       const msg =
//         err.response?.data?.detail ||
//         err.response?.data?.media?.[0] ||
//         "Ошибка загрузки сторис";
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     console.log('create-story')
//   },[])


//    const handleDelete = async () => {
//     alert('safd')
//     if (!currentStoryId) return;

//     try {
//       await api.delete(`stories/${currentStoryId}/delete/`);
//       onSuccess?.();
//     } catch (err) {
//       console.error(err);
//       setError("Ошибка удаления сторис");
//     }
//   };

//   // ----------------------------
//   // UI
//   // ----------------------------
//   return (
//     <div className={styles["create-story"]}>
//       <label className={styles["story-upload"]} >
//         <input
//           type="file"
//           accept="image/*,video/*"
//           hidden
//           onChange={handleSelect}
//         />
//         <span>➕ </span>
//       </label>

//       {preview && (
//         <div className="story-preview">
//           {file.type.startsWith("image") ? (
//             <img src={preview} alt="preview" />
//           ) : (
//             <video src={preview} controls />
//           )}

//           <button onClick={handleUpload} disabled={loading}>
//             {loading ? "Загрузка..." : "Опубликовать"}
//           </button>
//         </div>
//       )}

//        {currentStoryId && (
//         <button className={styles.deleteBtn} onClick={handleDelete}>
//           🗑 Удалить текущую сторис
//         </button>
//       )}

//       {error && <div className="story-error">{error}</div>}
//     </div>
//   );
// }



import { IoAddOutline, IoTrashOutline, IoCloseOutline, IoCloudUploadOutline } from "react-icons/io5";

import styles from './CreateStory.module.css';


const MAX_VIDEO_SIZE_MB = 50;

export default function CreateStory({ onSuccess }) {
  const currentStoryId = useStory((s) => s.currentStoryId);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 
  const handleSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    // Расширяем проверку: MIME-тип ИЛИ расширение файла
    const isImage = f.type.startsWith("image");
    const isVideo = f.type.startsWith("video") || f.name.toLowerCase().endsWith('.webm');

    if (!isImage && !isVideo) {
      setError("Можно загрузить только фото или видео (включая .webm)");
      return;
    }

    if (isVideo) {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_VIDEO_SIZE_MB) {
        setError(`Видео не должно превышать ${MAX_VIDEO_SIZE_MB}MB`);
        return;
      }
    }

    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };


  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("media", file);

    try {
      await api.post("/stories/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closePreview();
      onSuccess?.();
    } catch (err) {
      setError("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    setFile(null);
    setPreview(null);
    setError("");
  };

  const handleDelete = async () => {
    if (!currentStoryId) return;
    if (!window.confirm("Удалить вашу текущую историю?")) return;
    try {
      await api.delete(`stories/${currentStoryId}/delete/`);
      onSuccess?.();
    } catch (err) {
      setError("Ошибка удаления");
    }
  };

  return (
    <div className={styles.container}>
      {/* Кнопка добавления (Круглая в углу или в списке) */}
      <div className={styles.controls}>
        <label className={styles.addButton}>
          <input type="file" accept="image/*,video/*" hidden onChange={handleSelect} />
          <IoAddOutline />
        </label>
        
        {currentStoryId && (
          <button className={styles.deleteBtn} onClick={handleDelete} title="Удалить текущую">
            <IoTrashOutline />
          </button>
        )}
      </div>

      {/* Модальное окно предпросмотра (в стиле Instagram Stories) */}
      {preview && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewContent}>
            <button className={styles.closeBtn} onClick={closePreview}>
              <IoCloseOutline />
            </button>

            <div className={styles.mediaContainer}>
              {file.type.startsWith("image") ? (
                <img src={preview} alt="preview" />
              ) : (
                <video src={preview} autoPlay muted loop />
              )}
            </div>

            <div className={styles.previewFooter}>
              <button className={styles.publishBtn} onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <div className={styles.loader}></div>
                ) : (
                  <>
                    <IoCloudUploadOutline />
                    <span>Поделиться</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}