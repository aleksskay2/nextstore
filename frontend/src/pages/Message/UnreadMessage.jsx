import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";
import favorite from '../../assets/images/favorite.png'
import styles from './UnreadMessage.module.css'
import useStore  from '../../components/store/store'
import iconmessages from '../../assets/icons/messages.png'

const UnreadMessage = () => {
    const user = useStore((s) => s.user);
 	const unreadRefresh= useStore((s) => s.unreadRefresh) 
    const setUnreadRefresh = useStore((s) => s.setUnreadRefresh)

    const  enterChat = useStore((s) => s.enterChat) 
    const isAuth = !!user;
    const [unreadCount, setUndreadCount] = useState(0)

    // useEffect(() => {
    //     fetchUnread();
    // }, [])


    useEffect(() => {
        // if (!user) {
        //     setUndreadCount(0)
        //     console.log('isAuth -', isAuth)
        //     return;

        // }

      
    // Для обновления сообщений внизу в пункте сообщений
        // setInterval(() => {
        //     fetchUnread()
        // }, 6000);
    
        const fetchUnread = async () => {
            
            console.log('iuAuth - ', isAuth)
            console.log('user - ', user)
            const token = localStorage.getItem('access')
           
           if (token)   {
                try {
                const res = await api.get('messages/unread_count');
                setUnreadRefresh(res.data.unread_count)
           

                let count = res.data.unread_count
                if (enterChat === true)
                    count = unreadRefresh
                setUndreadCount(count)
                
                console.log('res in Unread - ', res.data.unread_count)
                console.log('EnterChat - ', enterChat)
                console.log('unreadRefresh in UnreadPage- ', unreadRefresh)
            }
            catch (error) {
                console.error('Ошибка при получении непрочитанных сообщений.', error )
            }
           }
           else {
                setUndreadCount(0)
                return;
           }
           
            
        }
        fetchUnread()
        
    } ,
    [user, isAuth, enterChat, unreadRefresh ])


    return (

            <div style={{position:"relative"}}  >
                <div className={styles['item-bar']} >
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={iconmessages} alt="not logo" />
                        </div>
                        <div className={styles['item-bar__title']}>Сообщения</div>
                        
                    </div>
                </div>
                {
                unreadRefresh > 0 && (
                    <span style={{
                            position:'absolute',
                            top:'-3px',
                            right:'3px',
                            background:'red', 
                            color:'white',
                            borderRadius:'50%',
                            padding:'2px 6px',
                            fontSize:'12px'

                        }}  >
                        {unreadRefresh}
                    </span>
                )}

                 
            </div>
         
               
            
        

        // <div style={{position:"relative"}}>
        //     <span>Сообщения</span>
        //     {
        //         unreadCount > 0 && (
        //             <span style={{
        //                     position:'absolute',
        //                     top:'-5px',
        //                     right:'-10px',
        //                     background:'red', 
        //                     color:'white',
        //                     borderRadius:'50%',
        //                     padding:'2px 6px',
        //                     fontSize:'12px'

        //                 }}  >
        //                 {unreadCount}
        //             </span>
        //         )
        //     }
        // </div>
    )
}

export default UnreadMessage;

