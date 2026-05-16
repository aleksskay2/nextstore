import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";
import favorite from '../../assets/images/favorite.png'
import styles from './UnreadMessage.module.css'
import useStore  from '../../components/store/store'
import iconmessages from '../../assets/icons/messages.png'
import { useMessageChatsStore } from "../../components/store/useMessageChatsStore";




const UnreadMessage = () => {
    const user = useStore((s) => s.user);
    
    // // 1. Берем актуальное количество из стора чатов
    const totalUnread = useMessageChatsStore((state) => state.totalUnread);
    const loadChats = useMessageChatsStore((state) => state.loadChats);

    // // 2. Загружаем чаты только при инициализации, если юзер авторизован
    // useEffect(() => {
    //     if (user) {
    //         loadChats();
    //     }
    // }, [user, loadChats]);

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
            {/* 3. Показываем бейдж только если сообщений > 0 */}
            {totalUnread > 0 && (
                 <span style={{
                            position:'absolute',
                            top:'-2px',
                            right:'3px',
                            background:'#25d366', 
                            color:'white',
                            borderRadius:'50%',
                            padding:'3px 0px 0px 5px',
                            fontSize:'12px',
                            width: "18px",
                            height: "18px",
                        }

                        }  >
                    {totalUnread > 99 ? '99+' : totalUnread}
                </span>
            )}
        </div>
    );
}

export default UnreadMessage;