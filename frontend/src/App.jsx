import { useState } from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import ProductList  from './pages/ProductList'

import Home from './pages/Home'
import './App.css'
import AddProductUser from './pages/AddProductUser'
import Header from './components/Header'



function App() {
 

  return (
   <Router>
      <Header/>
      <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path = '/store-admins' element={<ProductList/>}/>
          <Route path='/add-product' element={<AddProductUser/>}/>
          
      </Routes>
   </Router>
  )
}

export default App
