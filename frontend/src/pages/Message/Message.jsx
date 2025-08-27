import { useState } from "react";
import api from "../../api/axios";
import styles from '../Message/Message.module.css'

const Message = ({product}) => {
    const [showMessageForm, setShowMessageForm] = useState(false)
    const [messageText, setMessageText] = useState('')


    const sendMessage = async ()  => {
        const token = localStorage.getItem('access');
        if (!token)
        {
            alert('Войдите в систему, чтобы отправить сообщение')
        }

        if (!messageText.trim()) {
            alert('Введите сообщение')
            return;
        }

        try {
            await api.post('/messages/', {
                receiver: product.owner,
                product: product.id,
                text: messageText,
            })
            alert('Сообщение отправлено продавцу!')
            setMessageText('')
            setShowMessageForm(false)
        }catch(error) {
            console.error('Ошибка при отправке сообщения.', error)
            alert('Ошибка при отправке сообщения!')
        }
    }

    return (
        <div className={styles['product__message']} >
            {/* Написать продавцу */}

            <button onClick={() => setShowMessageForm(!showMessageForm)} >
                Написать продавцу
            </button>

            {
                showMessageForm && (
                    <div>
                        <textarea
                            value={messageText} 
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Введите ваше сообщение" rows={3}
                        /> 
                        <br />
                        <button onClick={sendMessage} >Отправить</button>
                        <button onClick={()  => setShowMessageForm(false)} >Отмена</button>
                            
                         
                    </div>
                )
            }
            

        </div>
    )



}

export default Message;