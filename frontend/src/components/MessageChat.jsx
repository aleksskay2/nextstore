import React, {useState, useEffect} from 'react';
import api from '../api/axios'

const MessageChat = ({receiverId, productId}) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('')
    
    const token = localStorage.getItem('token')
    
    const fetchDialog = async () => {
        try {
            const response = await api.get(`messages/dialog/${receiverId}/${productId}/`, {
            headers:{Authorization: `Bearer ${token}`,}})
            setMessages(response.data)
            console.log('mess in MesChat -', response.data)
        } catch(error) {
            console.error('Ошибка при загрузке диалога', error)
        } 
    }

    useEffect(() => {
        fetchDialog();
        const interval = setInterval(fetchDialog, 3000);
        return () => clearInterval(interval)
    }, [receiverId, productId])

    const sendMessage = async () => {
        try {
            api.post(`/message/`, {
            receiver:receiverId,
            productId : productId,
            text: text
        },
        {
            headers:{Authorization: `Bearer ${token}`,}} 
        ) 
            setText('')
            fetchDialog();
        } 
        catch(error) {
            console.error('Ошибка при отпрпвке', error)
        }

       


    }



    return (
       <div style={{ border: "1px solid #ccc", padding: "10px", width: "400px" }}>
            <div style={{ height: "300px", overflowY: "scroll", borderBottom: "1px solid #ccc" }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ textAlign: msg.is_own ? "right" : "left" }}>
                        <b>{msg.sender_name}:</b> {msg.text}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "10px" }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ width: "80%" }}
                    placeholder="Введите сообщение..."
                />
                <button onClick={sendMessage}>Отправить</button>
            </div>
        </div>
    )

} 
export default MessageChat;


