import {Link, useNavigate} from 'react-router-dom'
import { parseJwt } from '../../utils/jwt';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './Header.module.css'

const Header = () => {
    const token = localStorage.getItem('access');
    // const userData = token ? parseJwt(token):null;
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState(null)
    const navigate= useNavigate();

    useEffect(()=> {
        fetchUser()
    }, [token, navigate])


    // const isAuthenticated = !! token;

    
    // информация о  текущем пользователе.
    const fetchUser = async () => {
        if (!token) {
            setIsLoading(false)
            return;
        }
        try {
              const response = 
              await api.get('user/')
            console.log('response', response)
            setUser(response.data)
        }
        catch (error) {
            console.log('error', error)
           
            setUser(null)
        }
        finally {
            setIsLoading(false)
        }
    } 
    
    const handleLogout = async () => {

        try {
            const refresh = localStorage.getItem('refresh')
            if (refresh) {
                await api.post('/logout/', {refresh});
            }
        }
        catch(error) {
            console.log('Ошибка при выходе', error.response?.data || error.message);
        }
        finally {
              localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        setUser(null)
        navigate("/login")
        }

      
      
    }


    return (
        <>
       
        <div className="container">
 <nav>

            {/* <Link to="/">Главная</Link> | */}
            
            <div>
                {
                 isLoading ? (
                    <span> ... Загрузка</span>
                 ):
                user ? (
                        <>
                            <span>Привет, {user.username}</span>
                            <Link to="/my-products" style={{marginRight:'1rem'}}>Мои товары</Link>
                            <button onClick={handleLogout}>Выйти</button>
                        </>
                    ):
                    (
                        <>
                        <Link to="/login" className="hover:text-gray-300">Войти</Link>|
                        <Link to="/register" >Регистрация</Link>
                
                        </>
                    )  
                }
            </div>
          
          

          
        </nav>

        </div>
       
        </>
    )
  
}
export default Header;



