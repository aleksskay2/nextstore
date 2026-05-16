import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import useStore from "../../components/store/store";
import styles from "./MessagePage.module.css";
import ListChats from "./ListChats";
import SearchUser from "./SearchUser";
import ChatItem from "./ChatItem";
import { useStoryFeedStore } from "../../components/store/useStoryFeedStore";


// function getCurrentUser() {
//     const token = localStorage.getItem("access");
//     if (!token) return null;
//     try {
//         const decoded = jwtDecode(token);
//         return decoded; // тут будет объект с user_id, username и т.д.
//     } catch (e) {
//         console.error("Ошибка при декодировании токена", e);
//         return null;
//     }
// }

// const MessagePage = () => {
//     const [chats, setChats] = useState([]);
//     const navigate = useNavigate();
//     const setUnreadRefresh = useStore((s) => s.setUnreadRefresh);
   


//     const [unreadPrivateMessages, setUnreadPrivateMessages] = useState([]);

//     useEffect(() => {
     
//     }, []);

//     useEffect(() => {
//            const loadUnreadMessages = async () => {
//             const res = await api.get("/private-chat/unread-summary/");
//             console.log("UNREAD PRIVATE MESSAGES:", res.data);
//             setUnreadPrivateMessages(res.data);
           
//         };

//         loadUnreadMessages();

//         const fetchChats = async () => {
//             try {
//                 const res = await api.get("messages/chats");
//                 setChats(res.data);
//                 const unreadTotal = res.data.reduce(
//                     (sum, chat) => sum + chat.unread_count,
//                     0
//                 );
//                 setUnreadRefresh(unreadTotal);
//                 console.log("res.data in MessP - ", res.data);
//             } catch (error) {
//                 console.error("Ошибка при загрузке");
//             }
//         };
//         fetchChats();
//     }, [setUnreadRefresh]);

//     const user = getCurrentUser();


//     return (
//         <div className={styles["chats"]}>
//              {/* <h2>Поиск пользователей</h2>
//             <SearchUser /> */}
//             <ListChats chats={chats}/>
//             <ListChats chats={unreadPrivateMessages}/>
          
            
//         </div>




//     );
// };
// export default MessagePage;






// import { useEffect } from "react";
import {useMessageChatsStore} from '../../components/store/useMessageChatsStore'
// import useStore from "../../components/store/store";
// import ListChats from "./ListChats";
// import styles from "./MessagePage.module.css";
import { useProductFilter } from "../../components/store/useProductFilter";
// import SearchUser from "./SearchUser";





// const MessagePage = () => {
//     const {
//         chats,
//         unreadPrivate,
//         fetchChats,
//         fetchUnreadPrivate,
//         connectUnreadSetter, 
//         unreadPrivateTotal,
//     } = useMessageChatsStore();

//     const setUnreadRefresh = useStore((s) => s.setUnreadRefresh);

//     const user = useStore((s) => s.user);

//     useEffect(() => {
      
//         connectUnreadSetter(setUnreadRefresh); // привязка стора
//         fetchUnreadPrivate();
//         fetchChats();
//         // if (!user) return;   // ← не авторизован → не запускаем
//         fetchTotalUnread();
//     }, []);


    
    
//     const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);

//     useEffect(() => {
//         // if (!user) return;   // ← не авторизован → не запускаем
//         fetchTotalUnread();
//     }, []);
    


// return (
// <div className={styles["chats"]}>
//     <div  className={styles["chats__search"]} >
//         <SearchUser/>

//         <div>
//             <ListChats type="all" />
//             <ListChats type="private" />
//         </div>
//     </div>
  
   
// </div>
// );
// };

// export default MessagePage;








// const MessagePage = () => {


// const {
//   stories,
//   loadingFeed,
//   loadStories,
//   openViewer,
// } = useStoryFeedStore();


//   useEffect(() => {
//     loadStories();
//     console.log('stories', stories)
//   }, []);

// const { chats, loadChats, loading } = useMessageChatsStore();

//   useEffect(() => {
//     loadChats();
//     console.log('chats - ', chats)
//   }, []);

 

//   return (
//     <div className={styles["chats"]} >
//       <div className={styles["chats__container"]}>

//        {/* Сторис сверху */}
    
//      {/* ... внутри компонента */}
// <div className={styles.storiesContainer}>
//   {stories.map((group, index) => {
//     // Проверяем, есть ли непросмотренные сторис в группе
//     const hasUnviewed = group.stories.some(s => !s.is_viewed);
    
//     return (
//       <div
//         key={group.user.id}
//         className={styles.storyItem}
//         onClick={() => openViewer(index)}
//       >
//         <div className={`${styles.avatarBorder} ${hasUnviewed ? styles.unviewed : styles.viewed}`}>
//           <div className={styles.avatarBackground}>
//             <img
//               src={group.user.avatar || "/default-avatar.png"}
//               alt={group.user.username}
//               className={styles.avatarImage}
//             />
//           </div>
//         </div>
//         <span className={styles.username}>{group.user.username}</span>
//       </div>
//     );
//   })}
// </div>


  
//     <SearchUser /> 
//       {chats.map((chat) => (
//         <ChatItem
//           key={chat.id}
//           chat={chat}
//         />
//       ))}
//     </div>
//     </div>
   
//   );
// }

// export default MessagePage;











// import React, { useEffect } from "react";
// import styles from "./MessagePage.module.css";
// // Импорты твоих компонентов...
// import { useMessageChatsStore } from "./store/useMessageChatsStore";
//  import { useStoryFeedStore } from "./store/useStoryFeedStore";

const MessagePage = () => {
  // --- STORIES ---
  const { 
    stories, 
    loadStories, 
    openViewer 
  } = useStoryFeedStore();

  useEffect(() => {
    // Грузим сторис один раз при входе
    loadStories();
   
  }, []);

  // --- CHATS ---
  // Достаем данные из стора
  const { chats, loadChats, loading } = useMessageChatsStore();

  useEffect(() => {
    // Грузим чаты (REST API) один раз при входе.
    // Дальнейшие обновления придут через сокет в стор, и React сам перерисует список.
    loadChats();
    console.log('chats', chats)
  }, []);


  return (
    <div className={styles["chats"]}>
      <div className={styles["chats__container"]}>
        
        {/* STORIES BLOCK */}
        <div className={styles.storiesContainer}>
          {stories.map((group, index) => {
             const hasUnviewed = group.stories.some(s => !s.is_viewed);
             return (
               <div
                 key={group.user.id}
                 className={styles.storyItem}
                 onClick={() => openViewer(index)}
               >
                 <div className={`${styles.avatarBorder} ${hasUnviewed ? styles.unviewed : styles.viewed}`}>
                   <div className={styles.avatarBackground}>
                     <img
                       src={group.user.avatar || "/default-avatar.png"}
                       alt={group.user.username}
                       className={styles.avatarImage}
                     />
                   </div>
                 </div>
                 <span className={styles.username}>{group.user.username}</span>
               </div>
             );
          })}
        </div>

        {/* CHATS BLOCK */}
        <SearchUser />
        
        <div className={styles.chatList}>
           {loading && chats.length === 0 ? (
               <div>Загрузка...</div>
           ) : (
               chats.map((chat) => (
                 <ChatItem key={chat.id} chat={chat} />
               ))
           )}
        </div>

      </div>
    </div>
  );
};

export default MessagePage;