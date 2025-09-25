import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../../api/axios";
import styles from "./ChatPage.module.css";
import { jwtDecode } from "jwt-decode";
import useStore from "../../components/store/store";
import MessageStatus from "./MessageStatus";
import ImageGallery from "./ImageGallery";
import DoubleClickImage from "./DoubleClickImage";
import clip from '../../assets/icons/clip.png'
import messageIcon from '../../assets/icons/arrow_message.png'
import { cn } from "../../utils/cn";

const ChatPage = () => {
    const { productId } = useParams();
    const location = useLocation();
    const senderFromState = location.state?.sender || null; // безопасно

    const setUnreadRefresh = useStore((s) => s.setUnreadRefresh);
    const setEnterChat = useStore((s) => s.setEnterChat);
    const fetchUnread = useStore((s) => s.fetchUnread);

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [files, setFiles] = useState([]);

    const [product, setProduct] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [receiverId, setReceiverId] = useState(null); // сюда сохраним с кем чат
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const chatRef = useRef(null);

    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState([]);
    const [startIndex, setStartIndex] = useState(0);

    const openGallery = (images, index) => {
        setGalleryImages(images);
        setStartIndex(index);
        setGalleryOpen(true);
    };

    const limit = 10;

    function getCurrentUser() {
        const token = localStorage.getItem("access");
        if (!token) return null;
        try {
            return jwtDecode(token);
        } catch (e) {
            console.error("Ошибка при декодировании токена", e);
            return null;
        }
    }

    useEffect(() => {
        fetchInitialData();
    }, [productId, senderFromState]);

    const fetchInitialData = async () => {
        setEnterChat(true);
        try {
            // 1. получаем данные продукта
            const productRes = await api.get(`products/${productId}`);
            setProduct(productRes.data);

            const ownerId = productRes.data.owner_info?.id;

            // 2. текущий пользователь
            const user = getCurrentUser();
            if (!user) return;

            setCurrentUserId(user.user_id);

            // 3. определяем собеседника: либо из state, либо продавец
            const otherUserId = senderFromState || ownerId;
            setReceiverId(otherUserId);

            fetchDialog(true, user.user_id, otherUserId);
        } catch (error) {
            console.error("Ошибка при загрузке продукта,", error);
        }
    };

    const fetchDialog = async (
        reset = false,
        userId = currentUserId,
        otherId = receiverId
    ) => {
        if (!userId || !otherId) return;

     
        if (!reset && chatRef.current) {
            prevScrollHeight = chatRef.current.scrollHeight;
        }

        try {
            // 4. получаем диалог
            const dialogRes = await api.get(
                `messages/dialog/${userId}/${otherId}/${productId}/?limit=${limit}&offset=${
                    reset ? 0 : offset
                }`
            );

          

                if (reset) {
                    setMessages(dialogRes.data.messages || []);
                    console.log("dialRes in ChatPage - ", dialogRes.data);
                    setOffset(limit);
                    // console.log('enterChat - ', enterChat)
                    setTimeout(() => {
                        if (chatRef.current) {
                            chatRef.current.scrollTop =
                                chatRef.current.scrollHeight;
                        }
                    }, 0);
                } else {

                      if (chatRef.current) {
                
                        const prevScrollHeight = chatRef.current.scrollHeight;
                        const prevScrollTop = chatRef.current.scrollTop;    
                            setMessages((prev) => [
                                ...(dialogRes.data.messages || []),
                                ...prev,
                            ]);
                            setOffset((prev) => prev + limit);

                            // восстанавливаем позицию.
                            // setTimeout(() => {
                            //     if (chatRef.current) {
                            //         const newScrollHeight =
                            //             chatRef.current.scrollHeight;
                            //         chatRef.current.scrollTop =
                            //             newScrollHeight -
                            //             prevScrollHeight +
                            //             prevScrollTop;
                            //     }
                            // }, 0);
                }
            }
            

            if (dialogRes.data.messages.length < limit) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Ошибка при загрузке чата", error);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (receiverId && productId) {
                    await api.post("messages/mark_as_read/", {
                        product_id: productId,
                        sender_id: receiverId,
                    });
                }

                if (cancelled) return;
                const res = await api.get("messages/unread_count");
                console.log(
                    "res.data.unread_count ChatPage - ",
                    res.data.unread_count
                );
                setUnreadRefresh(res.data.unread_count);
            } catch (error) {
                console.error("Ошибка при загрузки диалога сообщений.", error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [receiverId, productId]);

    useEffect(() => {
        if (chatRef.current)
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    // useEffect(() => {
    //     fetchDialog(true);
    // }, [productId, senderFromState]);

    const handleScroll = () => {
        if (chatRef.current.scrollTop === 0 && hasMore) {
            fetchDialog(false);
        }
    };

    // const sendMessage = async () => {
    //     if (!text.trim()) return;
    //     try {
    //         const res = await api.post("messages/send/", {
    //             receiver_id: receiverId,
    //             product: productId,
    //             text,
    //         });

    //         setMessages((prev) => [...prev, res.data]);
    //         setText("");
    //     } catch (error) {
    //         console.error("Ошибка при отправке:", error);
    //     }
    // };

    const sendMessage = async () => {
        if (!text.trim() && !files) return;

        try {
            const formData = new FormData();
            formData.append("receiver_id", receiverId);
            formData.append("product", productId);

            let messageText = text;
            // Когда отдельно отправляем изображение, тогда в качестве
            // текста используем имя изображения.
            if (messageText.trim() === "" && files[0]?.name) {
                messageText = files[0].name;
                setText(files[0].name);
            }

            if (messageText.trim()) {
                formData.append("text", messageText);
            }
            console.log("file in ChatPage - ", files);
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    formData.append("images", files[i]);
                }
            }

            console.log("text in ChatPage - ", text);
            const res = await api.post("messages/send/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessages((prev) => [...prev, res.data]);
            // очисить после отправки
            setText("");
            setFiles([]);
        } catch (error) {
            console.error("Ошибка при отпраке", error);
        }
    };

    return (
        <div>
            <h2>Чат по товару: {product?.productName}</h2>

            <div
                className={styles["chat"]}
                ref={chatRef}
                onScroll={handleScroll}
            >
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <div className={styles["chat__date"]}>
                            <small className={styles["chat__date"]}>
                                {new Date(msg.created_at).toLocaleDateString()}
                            </small>
                        </div>
                        <div
                            className={`${styles.chat__message} ${
                                msg.is_own ? styles.own : styles.other
                            }`}
                        >
                            <div
                                className={`${styles.chat__text} ${
                                    msg.is_own
                                        ? styles["color-text"]
                                        : styles.sender
                                }`}
                            >
                                {msg.text}
                                <div>
                                    {msg.images &&
                                        msg.images.map((img, index) => (
                                            <div>
                                                <DoubleClickImage
                                                    key={img.id}
                                                    src={img.image}
                                                    onDoubleClick={() =>
                                                        openGallery(
                                                            msg.images,
                                                            index
                                                        )
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>
                                {galleryOpen && (
                                    <div
                                        style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            width: "100vw",
                                            height: "100vh",
                                            background: "rgba(0,0,0,0.8)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        onClick={() => setGalleryOpen(false)}
                                    >
                                        <img
                                            src={
                                                galleryImages[startIndex].image
                                            }
                                            alt=""
                                            style={{
                                                maxWidth: "90%",
                                                maxHeight: "90%",
                                            }}
                                        />
                                    </div>
                                )}
                                <MessageStatus isRead={msg.is_read} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
              
            <div className={cn(styles.chat__send, styles.send)} >
                <div className={styles["send__clip"]} >
                     <input
                        id="inputFile"
                        multiple
                        type="file"
                       
                        accept="image/*"
                        onChange={(e) => setFiles(e.target.files)}
                    />
                    <label htmlFor="inputFile">
                    <img src={clip} alt=""  />
                </label>
                </div>
                
               
               <div className={styles["input__message"]} >
                     <input
                     name="message_text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Введите сообщение..."
                />
               </div>
                <div className={styles["send__message"]} >
                      <button onClick={sendMessage}>
                        <img src={messageIcon} alt=""  /></button>
                </div>

               
               
            </div>
        </div>
    );
};

export default ChatPage;

// import { useEffect, useState } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import api from "../../api/axios";
// import styles from "./ChatPage.module.css";
// import { jwtDecode } from "jwt-decode";
// import useStore from "../../components/store/store";

// const ChatPage = () => {
//     const { productId } = useParams();
//     const location = useLocation();
//     const senderFromState = location.state?.sender || null; // безопасно

// 	const setUnreadRefresh = useStore((s) => s.setUnreadRefresh)
// 	const setEnterChat = useStore((s) => s.setEnterChat)
// 	const fetchUnread  = useStore((s) => s.fetchUnread)

//     const [messages, setMessages] = useState([]);
//     const [text, setText] = useState("");
//     const [product, setProduct] = useState(null);
//     const [currentUserId, setCurrentUserId] = useState(null);
//     const [receiverId, setReceiverId] = useState(null); // <-- сюда сохраним с кем чат

//     function getCurrentUser() {
//         const token = localStorage.getItem("access");
//         if (!token) return null;
//         try {
//             return jwtDecode(token);
//         } catch (e) {
//             console.error("Ошибка при декодировании токена", e);
//             return null;
//         }
//     }

//     useEffect(() => {

//         const fetchDialog = async () => {
// 			setEnterChat(true)
//             try {
//                 // 1. получаем данные продукта
//                 const productRes = await api.get(`products/${productId}`);
//                 setProduct(productRes.data);

//                 const ownerId = productRes.data.owner_info?.id;

//                 // 2. текущий пользователь
//                 const user = getCurrentUser();
//                 if (!user) return;

//                 setCurrentUserId(user.user_id);

//                 // 3. определяем собеседника: либо из state, либо продавец
//               const senderFromState = location.state?.sender;
// if (!senderFromState) {
//   // если попали напрямую по URL — можно показать ошибку или подгрузить диалог по product + owner
//   return;
// }
// const otherUserId = senderFromState; //

//                 // 4. получаем диалог
//               const dialogRes = await api.get(`messages/dialog/${user.user_id}/${otherUserId}/${productId}/`);

//                 setMessages(dialogRes.data.messages || []);
//                 console.log('dialRes in ChatPage - ', dialogRes.data)
//                 // console.log('enterChat - ', enterChat)
//             } catch (error) {
//                 console.error("Ошибка при загрузке чата", error);
//             }
//         };

//          const fetchUnread = async () => {

//             try {
//                 const res = await api.get('messages/unread_count');
//                 // setUndreadCount(res.data.unread_count)
//                 // console.log('unreadRefresh in ChatPage - ', unreadRefresh)
//                 setUnreadRefresh(res.data.unread_count)
//             }
//             catch (error) {
//                 console.error('Ошибка при получении непрочитанных сообщений.', error )
//             }
//         }
//         fetchUnread()
//         fetchDialog();
//     }, [productId, senderFromState]);

// 	useEffect(() =>
// 		{
// 			const markRead = async () => {
// 				console.log('prod_id', productId)
// 				console.log('send_id', receiverId)

// 				try {
// 					if (receiverId && productId) {
// 						await api.post('messages/mark_as_read/', {
// 						product_id: productId,
// 						sender_id: receiverId,
// 					})

// 				}
// 				}
// 				catch (error){
// 					console.error(error, 'Ошибка при отметке сообщений, как прочитанное!')
// 				}
// 			}
// 			markRead()

// 	},[receiverId, productId])

//     const sendMessage = async () => {
//         if (!text.trim()) return;
//         try {
//             const res = await api.post("messages/send/", {
//                 receiver_id: messages.length ?
//           (messages[0].sender === currentUserId ? messages[0].receiver : messages[0].sender) :null,
//                 product: productId,
//                 text
//             });

//             setMessages((prev) => [...prev, res.data]);
//             setText("");
//         } catch (error) {
//             console.error("Ошибка при отправке:", error);
//         }
//     };

//     return (
//         <div>
//             <h2>Чат по товару: {product?.productName}</h2>

//             <div className={styles["chat"]}>
//                 {messages.map((msg) => (
//                     <div key={msg.id}>
//                         <div className={styles["chat__date"]}>
//                             <small className={styles["chat__date"]}>
//                                 {new Date(msg.created_at).toLocaleDateString()}
//                             </small>
//                         </div>
//                         <div
//                             className={`${styles.chat__message} ${
//                                 msg.is_own ? styles.own : styles.other
//                             }`}
//                         >
//                             <div
//                                 className={`${styles.chat__text} ${
//                                     msg.is_own
//                                         ? styles["color-text"]
//                                         : styles.white
//                                 }`}
//                             >
//                                 {msg.text}
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div>
//                 <input
//                     type="text"
//                     value={text}
//                     onChange={(e) => setText(e.target.value)}
//                     placeholder="Введите сообщение..."
//                 />
//                 <button onClick={sendMessage}>Отправить</button>
//             </div>
//         </div>
//     );
// };

// export default ChatPage;

// import { useEffect, useState } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import api from "../../api/axios";
// import styles from "./ChatPage.module.css";

// import { jwtDecode } from "jwt-decode";

// const ChatPage = () => {
//     const { productId } = useParams();
//     const location = useLocation();
//     const { sender } = location.state?.sender || null;
//     const [messages, setMessages] = useState([]);
//     const [text, setText] = useState("");
//     const [product, setProduct] = useState(null);
//     // const [sender, setSender] = useState('')
//     const [currentUserId, setCurrentUserId] = useState();

//     function getCurrentUser() {
//         const token = localStorage.getItem("access");
//         if (!token) return null;
//         try {
//             const decoded = jwtDecode(token);
//             return decoded; // тут будет объект с user_id, username и т.д.
//         } catch (e) {
//             console.error("Ошибка при декодировании токена", e);
//             return null;
//         }
//     }

//     useEffect(() => {
//         const fetchDialog = async () => {
//             try {
//                 // получаем продукт (чтобы узнать продавца)
//                 const productRes = await api.get(`products/${productId}`);
//                 setProduct(productRes.data);

//                 console.log("productRes in ChatPage - ", productRes.data);

//                 const user = getCurrentUser();
// 				if (!user) return;
//                 setCurrentUserId(user.user_id);

//                 // загружаем переписку между текущим пользователем и продавцом по тавору
//                const dialogRes = await api.get(
//                         `messages/dialog/${user?.user_id}/${sender}/${productId}/`
//                     );

// 				setMessages(dialogRes.data);
// 				 console.log("dialogRes in ChatPage - ", dialogRes.data);

//             }

//              catch (error) {
//                 console.error("Ошибка при загрузке чата", error);
//             }
//         };

//         fetchDialog();
//     }, [productId, currentUserId]);

//     const sendMessage = async () => {
//         try {
//             const res = await api.post("messages/send/", {
//                 receiver_id: sender,
//                 product: productId,
//                 text,
//             });

//             setMessages([...messages, res.data]);
//             console.log("messages in ChatPage - ", messages);
//             setText("");
//         } catch (error) {
//             console.error("Ошибка при отправке :", error);
//         }
//     };

//     return (
//         <div>
//             <h2>Чат по товару:{product?.productName}</h2>

//             <div className={styles["chat"]}>
//                 {messages.map((msg) => (
//                     <div key={msg.id}>
//                         <div className={styles["chat__date"]}>
//                             <small className={styles["chat__date"]}>
//                                 {new Date(msg.created_at).toLocaleDateString()}
//                             </small>
//                         </div>
//                         <div
//                             className={`${styles.chat__message} ${
//                                 msg.is_own ? styles.own : styles.other
//                             } `}
//                         >
//                             <div className={`${styles.chat__text}
// 							 ${msg.is_own ? styles['color-text']:styles.white  }`}>{msg.text}</div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div>
//                 <input
//                     type="text"
//                     value={text}
//                     onChange={(e) => setText(e.target.value)}
//                     placeholder="Введите сообщение..."
//                 />
//                 <button onClick={sendMessage}>Отправить</button>
//             </div>
//         </div>
//     );
// };

// export default ChatPage;

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import api from "../../api/axios";

// export default function ChatPage({ currentUserId }) {
//   const { productId } = useParams();
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [product, setProduct] = useState(null);

//   useEffect(() => {
//     const fetchDialog = async () => {
//       try {
//         // получаем детали продукта (чтобы узнать продавца)
//         const productRes = await api.get(`products/${productId}/`);
//         setProduct(productRes.data);
//         const ownerId = productRes.data.owner_info?.id;

//         if (!ownerId) return;

//         // грузим переписку между текущим пользователем и продавцом по товару
//         const dialogRes = await api.get(
//           `messages/dialog/${currentUserId}/${ownerId}/${productId}/`
//         );
//         setMessages(dialogRes.data);
//       } catch (err) {
//         console.error("Ошибка при загрузке чата:", err);
//       }
//     };

//     fetchDialog();
//   }, [productId, currentUserId]);

//   const sendMessage = async () => {
//     try {
//       const res = await api.post("messages/send/", {
//         receiver_id: product.owner_info.id,
//         product: productId,
//         text,
//       });
//       setMessages([...messages, res.data]); // обновляем список
//       setText("");
//     } catch (err) {
//       console.error("Ошибка при отправке:", err);
//     }
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-lg font-bold mb-4">
//         Чат по товару: {product?.productName}
//       </h2>

//       <div className="h-96 overflow-y-auto border p-2 mb-4 bg-gray-50">
//         {messages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`my-2 p-2 rounded max-w-[70%] ${
//               msg.is_own
//                 ? "bg-blue-200 ml-auto text-right"
//                 : "bg-gray-200 text-left"
//             }`}
//           >
//             <p className="text-sm">{msg.text}</p>
//             <small className="text-xs text-gray-600">
//               {new Date(msg.created_at).toLocaleString()}
//             </small>
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2">
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           className="flex-1 border p-2 rounded"
//           placeholder="Введите сообщение..."
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           Отправить
//         </button>
//       </div>
//     </div>
//   );
// }
