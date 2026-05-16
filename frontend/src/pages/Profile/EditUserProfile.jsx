import { useEffect, useState } from "react";
import api from "../../api/axios";
import styles from  "./EditUserProfile.module.css"
import { useParams } from "react-router-dom";

export default function EditProfile() {
    const {userId} = useParams()
  const [form, setForm] = useState({
    username: "",
    email: "",
    region: "",
    phone: "",
    avatar: null,
    avatar_preview: null,
  });

  useEffect(() => {
    const loadUser = async () => {
      const res = await api.get(`/users/${userId}`);
      console.log('res in data in EditUserProf', res.data)
      setForm({
        username: res.data.username,
        email: res.data.email,
        region: res.data.region || "",
        phone: res.data.phone || "",
        avatar: null,
        avatar_preview: res.data.avatar,
      });
    };
    loadUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, avatar: file, avatar_preview: URL.createObjectURL(file) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("username", form.username);
    data.append("email", form.email);
    data.append("region", form.region);
    data.append("phone", form.phone);
    if (form.avatar) data.append("avatar", form.avatar);

    try {
      await api.patch("/users/update-profile/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Профиль обновлён!");
    } catch (error) {
      console.error("Ошибка обновления профиля", error);
  
    }
  };

  return (
    <div className={styles["edit-profile-wrapper"]}>
      <form className={styles["edit-profile-card"]}  onSubmit={handleSubmit}>
        <h2>Редактировать профиль</h2>

        <div className={styles["avatar-section"]} >
          <img
            src={form.avatar_preview || "/default-avatar.png"}
            alt="avatar"
          className={styles["edit-avatar-preview"]} 
          />
          <input type="file" accept="image/*" onChange={handleAvatar} />
        </div>

        <label>Имя пользователя</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
        />

        <label>Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
        />

        <label>Регион</label>
        <input
          name="region"
          value={form.region}
          onChange={handleChange}
        />

        <label>Телефон</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />

        <button type="submit" className={styles["save-btn"]} >Сохранить</button>
      </form>
    </div>
  );
}
