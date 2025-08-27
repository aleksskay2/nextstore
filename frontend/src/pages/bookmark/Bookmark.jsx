import { useEffect, useState } from "react";
import api from "../../api/axios";
import styles from '../bookmark/Bookmark.module.css'

import { Link,useNavigate } from 'react-router-dom';
// import {ReactComponent as TrashIcon} from '../../assets/icons/basket.svg'
import EditUserProduct from '../Product/EditUserProduct'
import SearchAndSort from '../../components/SearchAndSort';
// import RegionFilter from '../components/RegionFilter'
import SelCategory from '../../components/SelCategory';

import delIcon from '../../assets/images/deletePng.png'
import ProductItem from "../ProductItem/ProductItem";


const BookMark = () => {
    const [bookmarks, setBookmarks] = useState([])
    useEffect(() => {
        
        fetchBookmarks();
    }, [])


    const fetchBookmarks = async () => {
            const token = localStorage.getItem('access')
             
            const response = await api.get('bookmarks/',
                {headers:{Authorization: `Bearer ${token}`}}
            )
            setBookmarks(response.data)
            console.log('bookm - ',response.data)
    }

     const updateBookmark = (productId, newBookmarkState) => {
        setBookmarks(prev => 
            prev.map(p => (p.id === productId 
            ? {...p, is_bookmark:newBookmarkState} : p))
        )
          fetchBookmarks();
    }

    return(
        <div>
           <h2>избранное</h2>
          
            {
                bookmarks.map(product => (
                     <ProductItem product={product.product} onBookmarkChange={updateBookmark} />
                )
                )
                   
                
            }
           
        </div>
    )
}

export default BookMark;