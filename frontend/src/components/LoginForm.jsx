import { useEffect, useState } from "react";
import { parseJwt } from "../utils/jwt";

import useStore from "./store/store";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from './LoginForm.module.css'
import { useAppStore } from "./store/appStore";
// import useGlobalSocket from "../hooks/useGlobalSocket";



const LoginForm = () => {
    const [formData, setFormData] = useState({username:'', password: ''});
    const [message, setMessage] = useState('')
    const [myId, setMyId] = useState('')
    const navigate = useNavigate()
    const {login } = useStore()
   

    // useEffect(() => {
    //     const checkAuth = async () => {
    //         const access = localStorage.getItem('access')

            
    //         if (access) {
    //             try {
    //                 await api.get('/product/');
    //                 navigate('products/')
    //             }
    //             catch(error) {
    //                 console.error('Tokeн недействителен', error.response?.data ||
    //                     error.message
    //                 );
    //                 localStorage.removeItem('access')
    //                 localStorage.removeItem('refresh')
    //             }
    //         }
               
    //     };
    //     checkAuth();
    // }, [navigate])

   


    useEffect(() => {
  const access = localStorage.getItem("access");
  if (access) {
    navigate("/products");
  }
}, []);

 

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
           
            const decoded = jwtDecode(response.data.access)
            login(decoded)

            localStorage.setItem('refresh', response.data.refresh)
            localStorage.setItem('user_id', response.data.id)
            console.log('myid -' , myId)
            console.log('refresh', response.data)
            
            // alert('Вы успешно вошли')
            await useAppStore.getState().fetchUser();
            // const user = useAppStore(s => s.user)
            // const userId = user.id;
            navigate('/')
          
         
          
        }
        catch(error){
            console.log(error.response?.data)
            // alert('Неверный пароль или логин')
            
        }
    } 


    return (
        <div className={styles['container']}>
            <form autoComplete="on" className={styles['form']}  onSubmit={handleSubmit}>
                <div className={styles['form__username']} >
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username}
                        placeholder="Логин" 
                        onChange={handleChange} required  
                        autoComplete="username"
                        />
                </div>
              
                <div className={styles['form__password']} >
                    <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        placeholder="Пароль" 
                        onChange={handleChange} required 
                    /> 
                </div>
            
                <div  >
                    <button className={styles['form__enter']} type="submit">Войти</button>
                </div>
            
         
               
            </form>
        </div>
       
    )
}
export default LoginForm;

