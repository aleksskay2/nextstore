import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";

function DialogPage() {
	const { user1, user2 , productId} = useParams();
	const [searchParams] = useSearchParams();


	const token = localStorage.getItem("access");

	const myId = Number(localStorage.getItem("user_id"));

	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");

	const messagesEndRef = useRef(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({behavior:'smooth'})
	}

	// Загружаем историю
	useEffect(() => {
		
		fetchMessages()
	
		 setInterval(() => {
			fetchMessages()
			scrollToBottom()
		}, 5000);
		
	
	}, [user1, user2, productId]);

	// useEffect(() => {
	// 	scrollToBottom();
	// }, [messages])

  	const fetchMessages = async() => {
	
		try {
			
			const res = await api.get(`/messages/dialog/${user2}/${user1}/${productId}`, {
					headers: { Authorization: `Bearer ${token}` },
				})
			setMessages(res.data)
			console.log('dia - ', )
		}
		catch (error) {
			console.log('Ошибка при получении сообщений', error)
		}
	
	}

  	const sendMessage = async() =>{
		const receiverId = Number(user2)
		try {
			console.log('rec',receiverId )
			console.log('text',input )
			console.log('prod', productId)

			await api.post('messages/send/', {
				receiver_id:receiverId,
				text: input,
				product:Number(productId)
			},
			{headers: { Authorization: `Bearer ${token}` }}
			)
			setInput('')
			fetchMessages()
		}
		catch (error) {
			console.error(error,'Ошибка при отправке сообщения',)
		}
	}

  

  

  return (
    <div>
      <h2>Чат</h2>
      <div
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          height: "300px",
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
           
              margin: "5px 0",
            }}
          >
            <strong>{msg.sender_name || msg.sender}</strong>: {msg.text}
			<div ref={messagesEndRef}/>
          </div  >
		
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => 
			setInput(e.target.value)}
        placeholder="Напишите сообщение..."
      />
      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
}

export default DialogPage;