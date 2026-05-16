import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import styles from './EditGroupPage.module.css'



export default function EditGroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  // 📥 загрузка группы
  useEffect(() => {
    api.get(`/groups/${groupId}/`).then(res => {
      setTitle(res.data.title);
      setIsPrivate(res.data.is_private);
      setPreview(res.data.avatar);
    });
  }, [groupId]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("is_private", isPrivate);
    console.log('avatar - ', avatar)
    if (avatar) formData.append("avatar", avatar);

    setLoading(true);
    try {
     await api.patch(
        `groups/${groupId}/`,
        formData,
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        }
        );
      navigate(`/groups/${groupId}`);
    } catch (e) {
      console.error("Ошибка обновления группы", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.edit}>
      <h2>Редактировать группу</h2>

      <div className={styles.avatar}>
        <img
          src={preview || "/group-default.png"}
          alt=""
          width={120}
          height={120}
        />
        <input type="file" onChange={handleAvatarChange} />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название группы"
      />

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={() => setIsPrivate(!isPrivate)}
        />
        Приватная группа
      </label>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}
