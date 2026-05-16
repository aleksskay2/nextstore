

// import { useGroupsStore } from "@/store/groups.store";

import { useGroupsStore } from "../store/groups.store";
import GroupHeader from "./GroupHeader";
import GroupMessages from "./GroupMessages";
import GroupInput from "./GroupInput";
// import { useGroupSocket } from "@/hooks/useGroupSocket";
import { useGroupSocket } from "../../hooks/useGroupSocket";
import { useEffect, useCallback, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import styles from './GroupChat.module.css'
import { useAppStore } from "../store/appStore";





export default function GroupChat() {
  const { groupId } = useParams();
  const [selGroup, setSelGroup] = useState(null);
  // const [userId, setUserId] = useState(null);
  // const [userName, setUserName] = useState(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [readByData, setReadByData] = useState(null);

  const messageRefs = useRef({});


  
  const user = useAppStore((s) => s.user);
  const userId = user?.id;
  const userName = user?.username
  
  // Загружаем группу и текущего пользователя
  useEffect(() => {
    const init = async () => {
      

      console.log('userId - ', userId)
      const res = await api.get(`/groups/${groupId}/`);
      setSelGroup(res.data);
    };
    init();
  }, [groupId]);

 
  // useGroupSocket(selGroup?.id, userId, messageRefs);

  const canConnect = Boolean(selGroup?.id && userId);
  useGroupSocket(canConnect ? selGroup.id : null, userId, messageRefs);

  const setMembersCount = useGroupsStore(s => s.setMembersCount);
  

    useEffect(() => {
      if (!groupId) return;

      const fetchMessages = async () => {
        const res = await api.get(`group-messages/?group=${groupId}`);
        useGroupsStore.getState().setMessages(
          groupId,
          res.data.results.reverse()
        );

            // Получаем участников
        const membersRes = await api.get(`/groups/${groupId}/members/`);
        setMembersCount(membersRes.data.length);


        setMessagesLoaded(true); // 🔥
      };

      fetchMessages();
    }, [groupId]);



  const joinGroup = useCallback(async () => {
  try {
    await api.post(`/groups/${groupId}/join/`);
    const res = await api.get(`/groups/${groupId}/`);
    setSelGroup(res.data);

  

  } catch (e) {
    alert(e.response?.data?.detail || "Ошибка");
  }
}, [groupId]);




//   useEffect(() => {
//     if (!socket) return;
//     if (socket.current?.readyState === WebSocket.OPEN) {
//         socket.current.send(JSON.stringify({ type: "chat_open" }));
//     }
// }, [socket]);


  if (!selGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Загрузка группы...
      </div>
    );
  }

  return (
    <div className={styles["chat__wrapper"]}>
      
      
      <div className={styles["chat__container"]} >
        <GroupHeader 
        currentUser={userId} 
        group={selGroup} 
        onJoin={joinGroup} 
        userName={userName}
       
      />
      
        <GroupMessages 
        currentUser={userId} groupId={selGroup.id} 
          messageRefs={messageRefs} // 
          userName={userName}
        />

        <GroupInput
        groupId={selGroup.id}
      />
      </div>
      
    </div>
  );
}
