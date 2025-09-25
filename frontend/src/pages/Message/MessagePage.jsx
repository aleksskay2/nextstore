import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import useStore from "../../components/store/store";
import styles from "./MessagePage.module.css";

function getCurrentUser() {
    const token = localStorage.getItem("access");
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return decoded; // тут будет объект с user_id, username и т.д.
    } catch (e) {
        console.error("Ошибка при декодировании токена", e);
        return null;
    }
}

const MessagePage = () => {
    const [chats, setChats] = useState([]);
    const navigate = useNavigate();
    const setUnreadRefresh = useStore((s) => s.setUnreadRefresh);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await api.get("messages/chats");
                setChats(res.data);
                const unreadTotal = res.data.reduce(
                    (sum, chat) => sum + chat.unread_count,
                    0
                );
                setUnreadRefresh(unreadTotal);
                console.log("res.data in MessP - ", res.data);
            } catch (error) {
                console.error("Ошибка при загрузке");
            }
        };
        fetchChats();
    }, [setUnreadRefresh]);

    const user = getCurrentUser();

    return (
        <div className={styles["chats"]}>
            <h2>{chats.length === 0 && <div>У вас пока нет переписок</div>}</h2>

           
                {chats.map((chat) => {
                    const companionId = chat.companion_id;

                    return (
                        <div
                            className={styles["chat__list"]}
                            onClick={() =>
                                navigate(`/chat/${chat.product_id}`, {
                                    state: { sender: companionId },
                                })
                            }
                            key={chat.id}
                            
                            >
                                <div className={styles["chats__image"]} >
                                    <img 
                                        src={chat.product_image}
                                        alt={chat.product_name}
                                        width={100}
                                />
                                </div>
                            
                            <div className={styles["chats__desc"]} >
                                <div>{chat.product_name}</div>
                                <div>{chat.last_message}</div>
                                <div>{chat.text}</div>
                                {/* <small>{new Date(chat.created_at).toLocaleDateString()}</small> */}
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
    );
};
export default MessagePage;

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../api/axios";
// import { jwtDecode } from "jwt-decode";
// import UnreadMessage from "./UnreadMessage";

// const MessagePage = () => {
//   const [chats, setChats] = useState([]);
//   const navigate = useNavigate();

//   function getCurrentUser() {
//     const token = localStorage.getItem("access");
//     if (!token) return null;
//     try {
//       return jwtDecode(token);
//     } catch {
//       return null;
//     }
//   }

//   useEffect(() => {
//     const fetchChats = async () => {
//       try {
//         const res = await api.get("messages/chats");
//         setChats(res.data);
//         console.log("res.data in MessP - ", res.data);
//       } catch (error) {
//         console.error("Ошибка при загрузке");
//       }
//     };
//     fetchChats();
//   }, []);

//   const user = getCurrentUser();

//   return (
//     <div>

//       <h2>{chats.length === 0 && <div>У вас пока нет переписок</div>}</h2>

//       <div>
//         {chats.map((chat) => {
//           const companionId =
//             chat.sender === user.user_id ? chat.receiver : chat.sender;

//           return (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "center",
//                 margin: "20px",
//               }}
//               onClick={() =>
//                 navigate(`/chat/${chat.product}`, {
//                   state: { sender: companionId },
//                 })
//               }
//               key={chat.id}
//             >
//               <img
//                 src={chat.product_image}
//                 alt={chat.product_name}
//                 width={100}
//               />
//               <div>
//                 <div>{chat.product_name}</div>
//                 <div>{chat.text}</div>
//                 <small>
//                   {new Date(chat.created_at).toLocaleDateString()}
//                 </small>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
// export default MessagePage;
