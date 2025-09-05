import { useState } from 'react'
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import ProductList  from './pages/ProductList/ProductList'

import Home from './pages/Home'
import './App.css'
import AddProductUser from './pages/AddProductUser'
import Header from './components/Header/Header'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import MyProducts from './pages/MyProducts'
import PrivateRoute from './components/PrivateRoute'
import EditUserProduct from './pages/Product/EditUserProduct'
import EditOwnerProduct from './pages/Product/EditOwnerProduct'
import Layout from './components/Layout'
import Profile from './pages/Profile/Profile'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import BookMark from './pages/bookmark/Bookmark'
import ChatPage from './pages/Message/ChatPage'
import MessagePage from './pages/Message/MessagePage'
import { useEffect } from 'react'
import useStore from './components/store/store'


// import {jwtDecode} from "jwt-decode";

// function getCurrentUser() {
//   const token = localStorage.getItem("access");
//   if (!token) return null;
//   try {
//     const decoded = jwtDecode(token);
//     return decoded; // тут будет объект с user_id, username и т.д.
//   } catch (e) {
//     console.error("Ошибка при декодировании токена", e);
//     return null;
//   }
// }



function App() {
  // const login = useStore((s) => s.login)
  // const logout = useStore((s) => s.logout)

//   useEffect(() => {
// 	const token = localStorage.getItem("access");
// 	if (!token) {
// 		logout(); // сбрасываем в zustand
// 		return;
// 	}

// 	try {
// 		const decoded = jwtDecode(token);
// 		login(decoded, token); // если токен норм — авторизуем
// 	} catch (e) {
// 		logout();
// 	}
// }, []);

  return (
   <Router>
      <Layout/>
      <Routes>
          <Route path='/' element={<ProductList/>}/>
          <Route path='/register' element={<RegisterPage/>}/>
          <Route path='/login' element={<LoginPage/>}/>
          <Route path = 'products/' element={<ProductList/>}/>
          <Route path='/add-product' element={<AddProductUser/>}/>
          <Route path='/edit-user-product/:id' element={<EditUserProduct/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='products/:id' element={<ProductDetail/>}/>
          <Route path='/bookmarks' element={<BookMark/>}/>

         
		<Route 
			path='/messages' 
			element={ <MessagePage/>}/>
		<Route
			path="/chat/:productId"
			element={ <ChatPage />}/>
				
         
        

          <Route path='my-products' element={
            <PrivateRoute>
            <MyProducts/></PrivateRoute>} />
            
          <Route path='/edit-product/:id' element={<PrivateRoute>
            <EditOwnerProduct/>
          </PrivateRoute>}>

          </Route>
      </Routes>
   </Router>
  )
}

export default App
