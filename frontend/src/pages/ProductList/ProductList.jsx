import React, {useState, useEffect} from 'react'
import { Link,useNavigate } from 'react-router-dom';
// import {ReactComponent as TrashIcon} from '../../assets/icons/basket.svg'
import api from '../../api/axios'
import EditUserProduct from '../../components/EditUserProduct';
import SearchAndSort from '../../components/SearchAndSort';
// import RegionFilter from '../components/RegionFilter'
import SelCategory from '../../components/SelCategory';
import styles from './ProductList.module.css'
import delIcon from '../../assets/images/deletePng.png'



const ProductList = () => {
    const [products, setProducts] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [editId, setEditId] = useState(null)
    const [query, setQuery ] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedRegion, setSelectedRegion] = useState('')
    const [textSearch, setTextSearch] = useState('')

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
            
            if (textSearch) 
            {
                if (url === 'products/' ){
                    url += `?search=${textSearch}`
                   
                }
                else
                if (url ==='products/?type=owner'|| url ==='products/?type=user')
                url += `&search=${textSearch}`
                
            }
               
            console.log('url', url)

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
               if (selectedRegion === '0' || selectedRegion === '') {
                   url = `products/` 
               }
                
                 
            }

            console.log('url', url)
            const response = await api.get(url)
         
            setProducts(response.data)
           
        }
       catch(error) {
            console.error(error)
       }
    }

    const handleRegionFilter = (filteredProducts) => {
        setProducts(filteredProducts)
    }


    // useEffect(() => {
    //     const fetchProductsFirst = async () => {
    //         // if (textSearch) {
    //         //     console.log('resp', products)
    //         //     console.log('query', textSearch)
    //         //     setProducts(products.filter(prod => 
    //         //             prod.productUser === 'owner'))
    //         //      console.log('respAfter', products)

    //         // }
    //         {
    //             const response = await api.get('products/');
    //             setProducts(response.data)
                
    //         }
           
    //     };
    //     fetchProductsFirst();
    // }, [])


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

    const handleEdit = (id) =>{
        setEditId(id)
    }




    const buttonStyle =(isActive) => ({
       
        backgroundColor: activeFilter === isActive ? 'rgb(95 109 122)':'rgb(197 223 243)',
        color:isActive === activeFilter? 'white' : 'black',
        border: 'none',
        borderRadius:'5px',
        gap:'20px'
    })


    const navigate = useNavigate()


    const handleClearSearch = () => {
        setProducts([])
        fetchProducts(activeFilter)
    }



    const fetchProductSearch = async (query) => {
        try {
            const response = await api('products/', {
                params:{
                        search:query,
                        ordering:'price'
                    }
            }
            )      
            setProducts(response.data)
            
        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
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

                        <div className={styles['product__item']}>
                            {
                                (!(products.length)) && (
                                    <div className={styles['product__count']}>
                                        Нет товара
                                    </div>
                                )
                            }

                            {products.map(product => (
                            <Link  to={`${product.id}`} className={styles['item-product']} key={product.id}>
                                 { (product.productUser === 'user') && (
                                    
                                    <div className={styles['item-product__btns']}>
                                        <button  className={styles['item-product__edit']} 
                                        onClick={() =>navigate(`/edit-user-product/${product.id}`)}>
                                                ...

                                            
                                        </button>     
                                        <button  className={styles['item-product__delete']} 
                                        onClick={() => handleDelete(product.id)}>
                                            <img src={delIcon} alt="" />
                                        </button>
                                    </div>
                                                                              
                                    ) }    
                                    <div className={styles['item-product__content']}>
                                            <div className={styles['item-product__img-price']} >
                                        
                                    {   
                                        (product.image == "http://127.0.0.1:8000/media/media") ?
                                        ( <div>Нет фото</div>):
                                        (<div className={styles['item-product__image']} >
                                            <img src={product.image} alt="" /></div>)
                                    }     
                                    <div className={styles['item-product__price']} >
                                        {product.price}
                                    </div>
                                    
                                </div>
                             
                                <div className={styles['item-product__info']}>
                                   
                                    
                                     <div className={styles['item-product__product-name']}>
                                        {product.productName}
                                    </div > 
                                     <div className={styles['item-product__weight']}>
                                        {product.weight}
                                    </div >
                                    
                                   
                                    <div className={styles['']}>
                                        {product.productUser}
                                    </div>
                                    <div className={styles['item-product__title']}>
                                        Имя магазина:
                                    </div>
                                    <div className={styles['item-product__store-name']} >
                                        {product.storeName}
                                    </div>
                                    <div  className={styles['item-product__region']}>
                                        {product.region}
                                    </div>
                                
                                </div>
                                 
                            </div>
                              
                             
                            
                            <div className={styles['item-product__address']}>
                                        {product.address} 
                            </div>    
                            

                                

                                    
                                      
                        </Link  >
                                        
                                    ))
                                } 
                            
                            </div>
                   
                        
                    </div>
                </div>
            </div>
           
            
          
            
           
       
        </>
    )

  

}
export default ProductList