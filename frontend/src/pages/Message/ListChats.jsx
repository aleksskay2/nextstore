// import { useNavigate } from 'react-router-dom';
// import styles from './ListChats.module.css'
// import { useEffect } from 'react';


// const ListChats = ({ chats}) => {
//     let navigate = useNavigate()
    
//     useEffect (() => {
//         console.log('chats in ListChats', chats.user_id)
//     },[])
//     return (
//      <>      
//      <h2>{chats.length === 0 && <div>У вас пока нет переписок</div>}</h2>

           
//                 {chats.map((chat) => {
//                     const companionId = chat.companion_id;

//                     return (
//                         <div
//                             className={styles["chat__list"]}
//                                onClick={() =>

//                                 (chat.product_name) ? (    
//                                     navigate(`/chat/${chat.product_id}`, {
//                                         state: { sender: companionId },
//                                     })
                                
//                                 ) :(
//                                         navigate(`/chat/private/${chat.user_id}`)
                                        
//                                 )
//                             }
                           
                            
//                             key={chat.id}
                            
//                             >

//                                 <div className={styles["chats__image"]} >
//                                    {
//                                     (chat.product_name) ? (    
                                    
//                                     <img 
//                                         src={chat.product_image}
//                                         alt={chat.product_name}
//                                         width={100}
//                                 />
                                
//                                 ) :(
//                                        <img 
//                                         src={chat.avatar}
//                                         alt={"Not avatar"}
//                                         width={100}
//                                 /> )
//                                    } 
//                                 </div>
                            
//                             <div className={styles["chats__desc"]} >
                            
//                                 <div><strong>{chat.product_name}</strong></div>
//                                 <div><strong>{chat.username}</strong></div>
//                                 <div>{chat.last_message}</div>
                              
//                                 <div>{chat.text}</div>
//                                 {/* <small>{new Date(chat.created_at).toLocaleDateString()}</small> */}
//                                 {chat.unread_count > 0 && (
//                                     <span style={{ color: "red" }}>
//                                         {chat.unread_count} непрочитанных
//                                     </span>
//                                 )}
//                             </div>
//                         </div>
//                     );
//                 })}
//         </>

//     )
// }

// export default ListChats;



import styles from './ListChats.module.css';
import { useNavigate } from "react-router-dom";
import { useMessageChatsStore } from "../../components/store/useMessageChatsStore";
import user_not_avatar from "../../assets/icons/user_not_avatar.png";
import { useProductFilter } from '../../components/store/UseProductFilter';
import useStore from '../../components/store/store';
import { useEffect } from 'react';





// const ListChats = ({ type = "all" }) => {
//     const navigate = useNavigate();
//     const getChatsByType = useMessageChatsStore((s) => s.getChatsByType);

//     const user = useStore((s) => s.user);
//      const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);
    
//         useEffect(() => {
//              if (!user) return;   // ← не авторизован → не запускаем
//         fetchTotalUnread();
//         }, []);

//     const chats = getChatsByType(type);

//     return (
//         <>
//             <h2>{chats.length === 0 && <div>У вас пока нет переписок</div>}</h2>

//             {chats.map((chat) => {
//                 const companionId = chat.companion_id;

//                 const goToChat = () => {
//                     if (chat.product_name) {
//                         navigate(`/chat/${chat.product_id}`, {
//                             state: { sender: companionId }
//                         });
//                     } else {
//                         navigate(`/chat/private/${chat.user_id}`);
//                     }
//                 };

//                 return (
                    // <div
                    //     key={chat.id}
                    //     className={styles["chat__list"]}
                    //     onClick={goToChat}
                    // >
                    //     <div className={styles["chats__image"]}>
                    //         {chat.product_name ? (
                    //             <img
                    //                 src={chat.product_image}
                    //                 alt={chat.product_name}
                    //                 width={100}
                    //             />
                    //         ) : (
                    //             <img
                    //                 src={chat.avatar || user_not_avatar}
                    //                 alt={"avatar"}
                    //                 width={50}
                    //             />
                    //         )}
                    //     </div>

                    //     <div className={styles["chats__desc"]}>
                    //         <div><strong>{chat.product_name}</strong></div>
                    //         <div><strong>{chat.username}</strong></div>
                    //         <div>{chat.last_message}</div>
                    //         <div>{chat.text}</div>

                    //         {chat.unread_count > 0 && (
                    //             <span style={{ color: "red" }}>
                    //                 {chat.unread_count} непрочитанных
                    //             </span>
                    //         )}
                    //     </div>
                    // </div>
//                 );
//             })}
//         </>
//     );
// };

// export default ListChats;








const ListChats = ({ type = "all" }) => {
  const navigate = useNavigate();
  const chats = useMessageChatsStore(s => s.getChatsByType(type));
  const user = useStore(s => s.user);

  if (chats.length === 0) {
    return <div>У вас пока нет переписок</div>;
  }

//   useEffect(() => {
//     console.log('chats - ', chats)
//   },[chats])

  return (
    <>
          <div className={styles["chat__container"]} >
      {chats.map(chat => {
        console.log('chat', chat)
        const goToChat = () => {
          if (chat.type === "product") {
            navigate(`/chat/${chat.product_id}`, {
              state: { sender: chat.user_id }
            });
          }

          
          if (chat.type === "private") {
            navigate(`/chat/private/${chat.companion_id}`);
          }

          if (chat.type === "group") {
            navigate(`/groups/${chat.group_id}/chat`);
          }
        };

        return (

          
                 <div  
            key={`${chat.type}-${chat.id}`}
            className={styles.chat__list}
            onClick={goToChat}
          >
            <div className={styles.chats__image}>
              <img
                src={chat.avatar || user_not_avatar}
                alt={chat.title}
                width={50}
              />
            </div>

            <div className={styles.chats__desc}>
              <div><strong>{chat.title}</strong></div>
              <div>{chat.last_message}</div>

              {chat.unread_count > 0 && (
                <span style={{ color: "red" }}>
                  {chat.unread_count} непрочитанных
                </span>
              )}
            </div>
          </div>
           
         
        );
      })}
       </div>
    </>
  );
};

export default ListChats;