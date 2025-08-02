import React, {useState, useEffect} from 'react'
import { Link,useNavigate } from 'react-router-dom';
import api from '../../api/axios'
import EditUserProduct from '../../components/EditUserProduct';
import SearchAndSort from '../../components/SearchAndSort';
// import RegionFilter from '../components/RegionFilter'
import SelCategory from '../../components/SelCategory';
import styles from './ProductList.module.css'

const ProductList = () => {
    const [products, setProducts] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [editId, setEditId] = useState(null)
    const [query, setQuery ] = useState('')
	 const [debouncedQuery, setDebouncedQuery] = useState("");
   

	
   useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
            
        }, (1500));
        return () => clearTimeout(timer);
    }, [query])

    const fetchProducts = async (filter)  => {
     
       try{
            let url = 'products/'
            if (filter === 'owner')
                url += '?type=owner'
            else
                if (filter === 'user')
                    url += '?type=user'
            
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

    useEffect(() => {
        const fetchProducts = async () => {
            const response = await api.get('products/');
            setProducts(response.data)
        };
        fetchProducts();
    }, [activeFilter])


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
        padding:'10px 20px',
        backgroundColor: activeFilter === isActive ? '#fCAF50':'rgb(197 223 243)',
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


    // кнопка Найти

     const handleClick = () => {
       
        buttonStyle()
        fetchProductSearch(query)
    }

    const handleTextQuery = (text ) => {
        setQuery(text)
		console.log('text in Найти - ', query)
		if (!text)
        fetchProductSearch(text); // передаём напрямую
        
    }
    const fetchProductSearch = async (searchTerm) => {
        try {
            const response = await api('products/', {
                params:{
                        search:searchTerm,
                        ordering:'price'
                    }
            }
            )      
            setProducts(response.data)
            console.log('query in Найти - ', query)
        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
    }





    return (
        <>
       
            <SearchAndSort onTextQuery={handleTextQuery}  onFilter={(results) => setProducts(results)} 
                    onResults={(results)  => setProducts(results)} onClear={handleClearSearch}    
            />
            <div className={styles['categ-add']}>
                <div className={styles['categ-add__container']}>
                    <div className={styles['categ-add__body']}>
                        <SelCategory className={styles['categ-add__category']} onResults={(results) => setProducts(results)}/>
                        <Link  className={styles['categ-add__add']} to="/add-product">Добавить товар</Link>
                    </div>
                  
                </div>
            </div>           

             <div>


            <button onClick={handleClick}>
                Найти
            </button>
        </div>

            <br />
       
           
            <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'20px'}}>
                <button onClick={() => setActiveFilter('all')}  style={buttonStyle('all')}  >Все </button>
                <button onClick={() => setActiveFilter('owner')} style={buttonStyle('owner')} >Владельцы</button>
                <button onClick={() => setActiveFilter('user')}  style={buttonStyle('user')} >Люди</button>
            </div>
            <h2>Товары</h2>
            
            {products.map(product => (
                    <div key={product.id}>
                        <h3>{product.productName}</h3>
                        <p>{product.price}</p>
                        <p>{product.address}</p>
                        <p>{product.productUser}</p>
                        <p>{product.storeName}</p>
                        <p>{product.region}</p>
                        
                           {  (product.image == "http://127.0.0.1:8000/media/media") ?
                        ( <div>Нет фото</div>)
                        :(<div><img src={product.image} alt="" width={150}/></div>)
                    }
                        { product.productUser === 'user' && (
                            <>
                                <button onClick={() => handleDelete(product.id)}>
                                        Удалить
                                    </button>
                                         
                                        
                                <button onClick={() =>navigate(`/edit-user-product/${product.id}`)}>
                                        Ред
                                    </button>                                        
                            </>
                               
                            ) }
                          
                        <hr />
                    </div>
                    
                ))}
       
        </>
    )

  

}
export default ProductList