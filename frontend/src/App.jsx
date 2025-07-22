import { useState } from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import ProductList  from './pages/ProductList'

import Home from './pages/Home'
import './App.css'
import AddProductUser from './pages/AddProductUser'
import Header from './components/Header'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'



function App() {
 

  return (
   <Router>
      <Header/>
      <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/register' element={<RegisterPage/>}/>
          <Route path='/login' element={<LoginPage/>}/>
          <Route path = 'productuser/' element={<ProductList/>}/>
          <Route path='/add-product' element={<AddProductUser/>}/>
          
      </Routes>
   </Router>
  )
}

export default App
