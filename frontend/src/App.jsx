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
import EditUserProduct from './components/EditUserProduct'
import EditOwnerProduct from './components/EditOwnerProduct'
import Layout from './components/Layout'
import Profile from './pages/Profile/Profile'
import ProductDetail from './pages/ProductDetail/ProductDetail'



function App() {
 

  return (
   <Router>
      <Layout/>
      <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/register' element={<RegisterPage/>}/>
          <Route path='/login' element={<LoginPage/>}/>
          <Route path = 'products/' element={<ProductList/>}/>
          <Route path='/add-product' element={<AddProductUser/>}/>
          <Route path='/edit-user-product/:id' element={<EditUserProduct/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='products/:id' element={<ProductDetail/>}/>
          
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
