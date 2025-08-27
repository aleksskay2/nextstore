import React, {useState, useEffect} from 'react'
import { Link,useNavigate } from 'react-router-dom';
// import {ReactComponent as TrashIcon} from '../../assets/icons/basket.svg'
import api from '../../api/axios'
import EditUserProduct from '../Product/EditUserProduct'
import SearchAndSort from '../../components/SearchAndSort';
// import RegionFilter from '../components/RegionFilter'
import SelCategory from '../../components/SelCategory';
import styles from './ProductList.module.css'

import {FaHeart, FaRegHeart} from 'react-icons/fa'
import ProductItem from '../ProductItem/ProductItem';
import useStore from '../../components/store/store';



const ProductList = () => {
    const [products, setProducts] = useState([])
    const {activeFilter, setActiveFilter} = useStore()
    const [editId, setEditId] = useState(null)
    const [query, setQuery ] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedRegion, setSelectedRegion] = useState('')
    const [textSearch, setTextSearch] = useState('')
    const [bookmarks, setBookmarks] = useState([])
    

   const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
   }




   const handleRegionSelect = (regionId) => {
        setSelectedRegion(regionId)
   }

	
    const handleTextSearch = (textSearch) =>{
        setTextSearch(textSearch)
    }
  
    const fetchProducts = async (filter)  => {
     
       try{
            let url = 'products/'
            if (filter === 'owner')
                url += '?type=owner'
            else
                if (filter === 'user')
                    url += '?type=user'
            
           
               
           

            if (selectedCategory ) {
                if (url === 'products/' ){
                    if (selectedRegion === '0' ) 
                    {
                        url += `?category=${selectedCategory}`    
                        console.log('selReg - ' , selectedRegion)        
                    }
                    else {
                        url += `?category=${selectedCategory}&region=${selectedRegion}`
                        console.log('selReg - ' , selectedRegion)
                    }
                   
                }
                else
                {
                    if (selectedRegion === '0') 
                    {
                        url += `&category=${selectedCategory}`            
                    }
                    else {
                         if (url ==='products/?type=owner'|| url ==='products/?type=user')
                        url += `&category=${selectedCategory}&region=${selectedRegion}` 
                    }
                    
                }
               
               
            }
            else {
               if ((selectedRegion === '0' || selectedRegion === '') && (filter === 'user') ) {
                   url = `products/?type=user` 
               }
               if ((selectedRegion === '0' || selectedRegion === '') && (filter === 'owner') ) {
                   url = `products/?type=owner` 
               }
                
                 
            }



             if (textSearch) 
            {
                if (url === 'products/' ){
                    url += `?search=${textSearch}`
                   
                }
                else {
                    
                                
                    if (url ==='products/?type=owner'|| url ==='products/?type=user') {
                       
                        url += `&search=${textSearch}`
                        console.log('text url', url)  
                    }
                  

                }
               

                
            }


            console.log('url--', url)
            const response = await api.get(url)
                  console.log('respList -', response.data)
            setProducts(response.data)
           
        }
       catch(error) {
            console.error(error)
       }
    }

    const handleRegionFilter = (filteredProducts) => {
        setProducts(filteredProducts)
    }




    useEffect( () => {
        fetchProducts(activeFilter)
    },[activeFilter])




    // Для удаления данных с productUser = 'user'
    const handleDelete = async (id) => {
        try {
            await api.delete(`delete-user-product/${id}`)
            setProducts(products.filter(prod => prod.id != id))
        }
        catch (error){
            console.error('error', error)
        }
    }

    // const handleEdit = (id) =>{
    //     setEditId(id)
    // }

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token ) return;
                
                const response = await api.get('bookmarks/', {
                    headers:{Authorization: `Bearer ${token}`}
                })

                setBookmarks(response.data.map(bookmark => bookmark.product.id));
            }
            catch (error) {
                console.error('Ошибка при получении избранного', error)
            }
        }
        fetchBookmarks();
    }, []) 


    






    const buttonStyle =(isActive) => ({
       
        backgroundColor: activeFilter === isActive ? 'rgb(95 109 122)':'rgb(197 223 243)',
        color:isActive === activeFilter? 'white' : 'black',
        border: 'none',
        borderRadius:'5px',
        gap:'20px'
    })


    const updateBookmark = (productId, newBookmarkState) => {
        setProducts(prev => 
            prev.map(p => (p.id === productId 
            ? {...p, is_bookmark:newBookmarkState} : p))
        )
    }



    const handleClearSearch = () => {
        setProducts([])
        fetchProducts(activeFilter)
    }



    


    return (
        <>
            <SelCategory  
            selectedRegion={selectedRegion} onCategorySelect={handleCategorySelect} 
             className={styles['categ-add__category']} onResults={(results) => setProducts(results)}/>
           
            <SearchAndSort 
                onTextSearch={handleTextSearch}
                onRegionSelect={handleRegionSelect}
                
                selectedCategory={selectedCategory}
                query={query} setQuery={setQuery}  onFilter={(results) => setProducts(results)} 
                    onResults={(results)  => setProducts(results)} onClear={handleClearSearch}    
            />
                      

            
            
           
       
            <div className={styles['product']}>
                <div className={styles['product__container']}>
                    <div className={styles['product__body']}>
                        <div className={styles['product__buttons']}>
                            
                            <button className={`${styles['product__button']} ${styles['product__buttons__all']}`}
                                onClick={() => setActiveFilter('all')}  style={buttonStyle('all')}  >Все 
                            </button>
                            <button className={`${styles['product__button']} ${styles['product__buttons__owners']}`}  
                                onClick={() => setActiveFilter('owner')}                     
                                style={buttonStyle('owner')} >
                                Владельцы
                            </button>
                            <button className={`${styles['product__button']} ${styles['product__buttons__users']}`}  
                                onClick={() => setActiveFilter('user')}
                                style={buttonStyle('user')} >Люди
                            </button>


                           
                                        
                        </div>
                        {
                            products.map(product => (
                                <ProductItem  deleteProd={handleDelete}  key={product.id}
                                    product={product} 
                                    onBookmarkChange={updateBookmark}
                                />
                            ))
                        }
                          
                        
                        

                   
                   
                        
                    </div>
                </div>
            </div>
           
            
          
            
           
       
        </>
    )

  

}
export default ProductList