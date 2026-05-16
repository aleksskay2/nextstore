import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ListChats.module.css"
import { useMessageChatsStore } from "../../components/store/useMessageChatsStore";

// function ChatItem({ chat }) {

//     const navigate = useNavigate();

//   const handleClick = () => {
//     if (chat.type === "private") {
//       navigate(`/chat/private/${chat.user_id}`);
      
//     }

//     if (chat.type === "product") {
//       // navigate(`/chat/${chat.id}`);
//        navigate(`/chat/product/${chat.product_id}/${chat.companion_id}`);
//     }

//     if (chat.type === "group") {
//       navigate(`/groups/${chat.id}`);
//     }

//   }

  
//     // useEffect(() => {
//     //     console.log('chat - ', chat)
//     // },[])


//   return (
//     <>
    

    
//     <div
//       key={chat.id}
//       className={styles["chat__list"]}  onClick={handleClick}
//       // onClick={goToChat}
//       >
//           <div className={styles["chats__image"]}>
//               {chat.product_name ? (
//                   <img
//                       src={chat.product_image}
//                       alt={chat.product_name}
//                       width={100}
//                   />
//               ) : (
//                   <img
//                       src={chat.avatar || "user_not_avatar"}
//                       alt={"avatar"}
//                       width={50}
//                   />
//               )}
//           </div>

//           <div className={styles["chats__desc"]}>
              
             

//               <div><strong>{chat.title}</strong></div>
//               <div><strong>{chat.username}</strong></div>
//               <div>{chat.last_message}</div>
//               <div>{chat.text}</div>

//               {chat.unread_count > 0 && (
//                   <span style={{ color: "red" }}>
//                       {chat.unread_count} непрочитанных
//                   </span>
//               )}
//           </div>
//       </div>
// </>



//   );
// }


// export default ChatItem;







function ChatItem({ chat }) {
  const navigate = useNavigate();

  const markChatAsRead = useMessageChatsStore((state) => state.markChatAsRead)

  const handleClick = () => {
    if (chat.type === "private") 
    {
      markChatAsRead(chat.user_id, "private");
      navigate(`/chat/private/${chat.user_id}`, {state:chat.avatar});
    }
     

    if (chat.type === "product")  {
      markChatAsRead(chat.product_id, "product");
      navigate(`/chat/product/${chat.product_id}/${chat.companion_id}`);
    }
    if (chat.type === "group") {
      markChatAsRead(chat.id, "group");
      navigate(`/groups/${chat.id}`);
    
    }
  };

  useEffect(() =>{
    console.log('chat - ', chat);
  })
   

  // Определяем, что показывать в качестве заголовка
  const chatTitle = chat.product_name || chat.title || chat.username || "Чат";
  // Определяем текст сообщения
  const lastMsg = chat.last_message || chat.text || "Нет сообщений";

  return (
    <div className={styles.chatItem} onClick={handleClick}>
      <div className={styles.avatarContainer}>
        {chat.product_name ? (
          <img
            src={chat.product_image || "/default-product.png"}
            alt="product"
            className={styles.productImage}
          />
        ) : (
          <img
            src={chat.avatar || "/default-avatar.png"}
            alt="avatar"
            className={styles.userAvatar}
          />
        )}
      </div>

      <div className={styles.chatInfo}>
        <div className={styles.chatTopRow}>
          <span className={styles.chatName}>{chatTitle}</span>
          <span className={styles.chatTime}>12:45</span> {/* Здесь можно добавить поле времени из API */}
        </div>
        
        <div className={styles.chatBottomRow}>
          <p className={styles.lastMessage}>{lastMsg}</p>
          {chat.unread_count > 0 && (
            <div className={styles.unreadBadge}>
              {chat.unread_count}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatItem;