import { useState } from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
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
import EditOwnerProduct from './components/EditOwnerProduct'
import Layout from './components/Layout'
import Profile from './pages/Profile/Profile'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import BookMark from './pages/bookmark/Bookmark'
// import MessageChat from './pages/Message/MessageChat'
import InboxMessages from './components/InboxMessages'
import DialogPage from './components/DialogPage'




function App() {
 

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
          <Route path='/messages' element={<InboxMessages/>}/>
          <Route path="/dialog/:user1/:user2" element={<DialogPage />} />
          
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
