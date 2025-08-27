


import api from "../api/axios";
import { useEffect, useState, useSyncExternalStore } from "react";
import MessageChat from "./MessageChat";
import { useNavigate } from "react-router-dom";

import DialogPage from "./DialogPage";

function InboxMessages(){
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedChat, setSelectedChat] = useState(null)
	const navigate = useNavigate();


	


    useEffect(() => {
		fetchInboxMessage();
		setInterval(() => {
			fetchInboxMessage();
		}, 10000);
		
    }
        
    ,[]);

	const fetchInboxMessage = async () => {
            try {
                const response = await api.get('messages/inbox/', {
                headers:{Authorization: `Bearer ${localStorage.getItem('access')}`,}})
                setMessages(response.data)
                console.log('messages', response.data)
                setLoading(false)
				 console.log('msg - ', localStorage.getItem('user_id'))
            }
            catch(error) {
                console.error('Ошибка при загрузке сообщений', error)
                setLoading(false)
            }

        }


	// Группировка сообщений только по sender_id
	const groupedMessages = messages.reduce((acc, msg) => {
		const key = msg.sender;
		if (!acc[key] || new Date(msg.created_at) > new Date(acc[key].created_at)) {
			acc[key] = msg;
		}
		return acc;
	}, {})

  // Преобразуем объект в массив для отображения
  const chatList = Object.values(groupedMessages);

    const openChat = (msg) => {
    const myId = localStorage.getItem('user_id')
		const  user1 = msg.receiver;
		const  user2 = Number(msg.sender)
		const roomParams = user1 + '_' + user2;
    console.log('user1 - ', user1)
		navigate(`/dialog/${user1}/${user2}`)		

           
        }


    if (loading) return <div>Загрузка...</div>
    
    return (
      <div>
   
      
			<div>
			 <h2>Входящие сообщения</h2>
		
			
          {chatList.map((msg) => (
            <div
              key={msg.id}
              onClick={() => openChat(msg)}
              style={{
                border: "1px solid #ccc",
                padding: "8px",
                margin: "5px",
                cursor: "pointer"
              }}
            >
              <strong>{msg.sender_name}</strong>: {msg.text}
            </div>
          ))}
		  </div>
		
		
        </div>
	
   
        
      
    
    )
}
export default InboxMessages;





// import api from "../api/axios";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// function InboxMessages() {
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchInboxMessage = async () => {
//       try {
//         const response = await api.get('messages/inbox/', {
//           headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
//         });
//         setMessages(response.data);
//         console.log('messages', response.data);
//         setLoading(false);
//       } catch (error) {
//         console.error('Ошибка при загрузке сообщений', error);
//         setError('Не удалось загрузить сообщения');
//         setLoading(false);
//       }
//     };
//     fetchInboxMessage();
//   }, []);

//   // Группировка сообщений только по sender_id
//   const groupedMessages = messages.reduce((acc, msg) => {
//     const key = msg.sender; // Группируем только по sender
//     if (!acc[key] || new Date(msg.created_at) > new Date(acc[key].created_at)) {
//       acc[key] = msg; // Сохраняем последнее сообщение от отправителя
//     }
//     return acc;
//   }, {});

//   // Преобразуем объект в массив для отображения
//   const chatList = Object.values(groupedMessages);

//   const openChat = (msg) => {
 
//     const senderId = Number(msg.sender); // ID отправителя
//     const receiverId = Number(msg.receiver); // ID получателя

//     // Сортируем user1 и user2 для консистентности
//     const user1 =senderId;
// 	const user2 = receiverId;

//     // Формируем путь для диалога без productId
//     const path = `/dialog/${user1}/${user2}`;
    
//     navigate(path);
//   };

//   if (loading) return <div>Загрузка...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h2>Входящие сообщения</h2>
//       {chatList.length === 0 && <p>Нет сообщений</p>}
//       <ul>
//         {chatList.map((msg) => (
//           <li
//             key={msg.sender} // Уникальный ключ по sender
//             onClick={() => openChat(msg)}
//             style={{
//               border: "1px solid #ccc",
//               padding: "8px",
//               margin: "5px",
//               cursor: "pointer",
//             }}
//           >
//             <strong>От: {msg.sender_name}</strong> <br />
//             <b>Сообщение: {msg.text}</b> <br />
//             <small>{new Date(msg.created_at).toLocaleDateString()}</small>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default InboxMessages;