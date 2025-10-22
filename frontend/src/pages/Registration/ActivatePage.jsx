import React, {useEffect, useState} from "react";
import axios from 'axios';
import {useNavigate, useSearchParams} from 'react-router-dom';
import api from '../../api/axios'

export default function ActivatePage(){
    const [searchParms] = useSearchParams();
    const [status, setStatus] = useState(null)

    useEffect(() => {
        const activateAccountUser = async () => {
            const uid = searchParms.get('uid');
            const token = searchParms.get('token');

            if (!uid || !token) {
                setStatus('Ошибка:Неверная ссылка')
                return;
            }
            try {
                const res = await api.post('http://localhost:8000/api/activate/', {uid, token})
                setStatus(res.data.detail)
            }
            catch (error){
                console.error('Ошибка активации', error.response?.data?.detail );
            }
        }
        activateAccountUser()
       
      

    }, [searchParms])

    const navigate = useNavigate()
    useEffect(() => {
        if (status === 'Аккаунт успешно активирован!')
        {
            setTimeout(() => 
                navigate("/login")  
            , 3);
        }
    }, [status])


    return (
        <div style={{padding:20}} >
            <h2>Активация аккаунта</h2>
            <p>{status ? status : 'Проверка'}</p>
        </div>
    )
}