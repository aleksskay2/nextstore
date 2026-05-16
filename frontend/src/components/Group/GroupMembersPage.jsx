import { useNavigate,useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import styles from "./GroupMembersPage.module.css"
import { useGroupsStore } from "../store/groups.store";


export default function GroupMembersPage() {
  const { groupId } = useParams();
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  const clearActiveGroup = useGroupsStore(s=> s.clearActiveGroup)

  useEffect(() => {

    const getMembers = async () => {
        try {
            const res =  await api.get(`groups/${groupId}/members/`)
            setMembers(res.data)
            console.log('res members - ', res.data)
      } 
      catch(error) {
        console.error('Ошибка при получения аватара и имя участника', error)
      }
    }

    getMembers()
   
}, [groupId]);


   const handleLeaveGroup = async () => {
    const confirm = window.confirm("Вы действительно хотите покинуть группу?");
    if (!confirm) return;

    try {
      await api.post(`groups/${groupId}/leave/`);

      // чистим стор
      clearActiveGroup(null);
      alert('Вы покинули группу')
      // уходим со страницы группы
      navigate("/messages");

    } catch (error) {
        console.error('Не удалось покинуть группу', error)
   
    }
  };


  return (
    <div className={styles["members"]}>
      <h3>Участники</h3>

      {members.map((m) => (
        <div className={styles["members__container"]}
          key={m.id}
          onClick={() => navigate(`/user/${m.id}`)}
          
        >
          <img
            src={m.avatar || "/no-avatar.png"}
            width={50}
            height={50}
            style={{ borderRadius: "50%", marginRight: 12 }}
          />
          <div className={styles[""]} >
            <div className={styles[""]} style={{ fontWeight: 500 }}>
              {m.username}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {m.role}
            </div>
          </div>
        </div>
      ))}


       {/* 🔴 КНОПКА ВЫХОДА */}
      <button className={styles["members__delete"]}
        onClick={handleLeaveGroup}>
        Покинуть группу
      </button>
       {/* 🔴 КНОПКА ВЫХОДА */}
      <button className={styles["members__delete"]}
        onClick={
          (e) => navigate(`/groups/edit/${groupId}`)
        }>
        Редактировать группу
      </button>
    </div>
  );
}
