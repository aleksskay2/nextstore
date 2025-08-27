import { useEffect, useState } from "react";
import { parseJwt } from "../utils/jwt";


import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
    const [formData, setFormData] = useState({username:'', password: ''});
    const [message, setMessage] = useState('')
    const [myId, setMyId] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            const access = localStorage.getItem('access')
           

            
            if (access) {
                try {
                    await api.get('/product/');
                    navigate('products/')
                }
                catch(error) {
                    console.error('Tokey недействителен', error.response?.data ||
                        error.message
                    );
                    localStorage.removeItem('access')
                    localStorage.removeItem('refresh')
                }
            }
               
        };


        checkAuth();
    }, [navigate])



    const handleChange = e => {
        setFormData( prev =>(
            {...prev, [e.target.name]: e.target.value}))
            
          
    }


    const handleSubmit = async e => {
        e.preventDefault();

        console.log(formData.username, formData.password)
        try {
            const response = await api.post('token/', formData);
            localStorage.setItem('access', response.data.access)
            localStorage.setItem('refresh', response.data.refresh)
            localStorage.setItem('user_id', myId)
            console.log('myid -' , myId)
            alert('Вы успешно вошли')
            navigate('/')
        }
        catch(error){
            console.log(error.response?.data)
            alert('Неверный пароль или логин')
            
        }
    } 


    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                name="username" 
                value={formData.username}
                placeholder="Логин" 
                onChange={handleChange} required  />
            <input 
                type="password" 
                name="password"
                value={formData.password}
                placeholder="Пароль" 
                onChange={handleChange} required  />
            <button type="submit">Войти</button>
        </form>
    )
}
export default LoginForm;

