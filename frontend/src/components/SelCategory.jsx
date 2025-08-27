import { useState, useEffect } from "react";
import api from "../api/axios";
import styles from './SelCategory.module.css'


const SelCategory = ({selectedRegion, onCategorySelect,  onResults, query, setQuery}) => {
    
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('');

    
     useEffect(() => {
        fetchCategories()
    }, [])


    const subcateg = []
      const fetchCategories = async () => {
       try{
            const responseCategories = await api.get('categories/')
            setCategories(responseCategories.data)
            console.log('Cat_res - ', responseCategories.data)
            for( let item of responseCategories.data)
                if (item.subcategories.length ) {
                    console.log('Cat_res_sub - ', item.subcategories)
                    for(let itemSub of item.subcategories) {
                        if (!subcateg.includes(itemSub.CategoryName))
                        subcateg.push(itemSub.CategoryName)
                    }
                }
            console.log('subcateg - ', subcateg)
           
            
        }
       catch(error) {
            console.error(error)
       }
    }


    const handleChangeCategories = async (e) => {

          try {
                if (selectedRegion !== '0') {
                    const response = 
                    await api(`products/?category=${e.target.value}&region=${selectedRegion}&ordering=price`, {    
                }
            )      
        
            onResults(response.data)
           
            }
                
          
        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
    }


   


    const handleSelectCategory = async (categoryId) => {
         
        let newCategid = categoryId
        

        if (selectedCategory === categoryId) {
            newCategid = ''
        }

        setSelectedCategory(newCategid) 
        onCategorySelect(newCategid)

        try {
            let response ;
            const params = {}
            if (newCategid ) params.category = newCategid
            if (selectedRegion && selectedRegion !== '0') params.region = selectedRegion;
            if (query) params.search = query;

            const queryString = new URLSearchParams(params).toString();
            console.log('querY - ', queryString)
            const url = `/products${queryString ? `?${queryString}`:''}`

         
            response = await api.get(url);
            onResults(response.data)
             console.log('cat - ', response.data)
        }   
        catch(error) {
            console.error('Ошибка при выборе категории', error)
        }
         
       
    }
 

    return (
        <div>
            <div className={styles['category-buttons-wrapper']} >
             
                    
                    {categories.map((cat) => (
                        <button 
                        className=
                        {`${styles['category-btn']}
                        ${selectedCategory === cat.id ? styles.active:''}`}
                        onClick={() => handleSelectCategory(cat.id)}  key={cat.id} >
                            {cat.CategoryName}
                        </button>
                    ))}
                


            </div>
        
            


             
        </div>
    )

}

export default SelCategory;





