import {Link, useNavigate} from 'react-router-dom'
import { parseJwt } from '../utils/jwt';
import { useEffect, useState } from 'react';
import axios from 'axios';

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
              await axios.get('http://127.0.0.1:8000/api/user', {
                headers:{
                
                    Authorization: `Bearer ${token}`
                }    
                
            })
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
    
    const handleLogout = () => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        setUser(null)
        navigate("/login")
      
    }


    return (
        <nav>
           {console.log('access',parseJwt(localStorage.getItem("access")))}

             <Link to="/">Главная</Link> |
            <Link to="products/">Список товаров</Link>|
            <Link to="/add-product">Добавить товар</Link>


            {/* {userData ? (
                <span>{userData.username}</span>
            ):(
                 <Link to='/login'>Войти</Link>
            )} */}
            <div>
                 {   console.log('user', user)}
                
                
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
                    ):(
                        <>
                         <Link to="/login" className="hover:text-gray-300">Войти</Link>|
                        <Link to="/register" >Регистрация</Link>
                    
                        </>
                        )
                      
                }
            </div>
          
          

          
        </nav>
    )
  
}
export default Header;




// import { Link, useNavigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { parseJwt } from '../utils/jwt';

// const Header = () => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();
//   const token = localStorage.getItem('access');


//   useEffect(() => {
//     const fetchUser = async () => {
//       if (!token) {
//         setIsLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get('http://127.0.0.1:8000/api/user', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setUser(response.data);
//       } catch (error) {
//         console.error('Ошибка при загрузке данных пользователя:', error);
//         setUser(null);
//         if (error.response?.status === 401) {
//           localStorage.removeItem('access');
//           localStorage.removeItem('refresh');
//           navigate('/login');
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUser();
//   }, [token, navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('access');
//     localStorage.removeItem('refresh');
//     setUser(null);
//     navigate('/login');
//   };

//   return (
//     <nav >
//       <div>
//         <div >
//           <Link to="/" >Главная</Link>
//           <Link to="/products" >Список товаров</Link>
//           <Link to="/add-product" >Добавить товар</Link>
//         </div>
//         <div >
//           {isLoading ? (
//             <span>Загрузка...</span>
//           ) : user ? (
//             <>
//               <span>Привет, {user.username}</span>
//               <button
//                 onClick={handleLogout}>
//                 Выйти
//               </button>
//             </>
//           ) : (
//             <>
//               <Link to="/login">Войти</Link>
//               <Link to="/register" >Регистрация</Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Header;