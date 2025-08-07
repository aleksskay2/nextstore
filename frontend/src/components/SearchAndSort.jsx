import { use, useEffect, useState } from "react";
import api from "../api/axios";
import styles from './SearchAndSort.module.css'
import iconsearch from '../assets/images/LetterS.png'
import { Link } from "react-router-dom";

const SearchAndSort = ({onTextSearch, onRegionSelect, selectedCategory,
     onFilter, onResults, onClear}) => {
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState("");
    const [regions, setRegions] = useState([]);
    const [regId, setRegId] = useState()


  // Получение списка регионов
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await api.get("/regions/");
        setRegions(response.data);
      } catch (error) {
        console.error("Ошибка загрузки регионов", error);
      }
    };
    fetchRegions();
  }, []);

  

  
    
    const fetchProducts = async (searchTerm, regionId) => {
        try {
            let url = `/products/?search=${searchTerm}&ordering=price`;
            if (regionId) {
                url += `&region=${regionId}`
            }

            const response = await api.get(url);
            onResults(response.data);
        }
        catch (error) {
            console.error('Ошибка при поиске товаров', error)
        }
    }

    

    const fetchProductSearch = async () => {
        try {
            console.log('fetchProds regId = ', regId)
            let response 
            if (regId){
               
                 response = await api(`products/?region=${regId}`, {
                    params:{
                            search:query,

                            ordering:'price'
                        }
                    }
                    )      
                    }
            else {
                response = await api(`products/`, {
                    params:{
                            search:query,

                            ordering:'price'
                        }
                    }
                    )      
                }
            
           
            onResults(response.data);
        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
    }


   
   

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchProductSearch()
        }
    };


    const handleChange = async (e) => {
        const selectedRegId = e.target.value;
        onRegionSelect(selectedRegId)
        
        setRegion(selectedRegId)
        try {
            let response ;
            if (selectedRegId === '0') {
                if (query) {
                    response =await api.get(`products/?category=${selectedCategory}&search=${query}`)
                }
                else if (selectedCategory) {
                     response = await api.get(`products/?category=${selectedCategory}`)
                } else {
                    response = await api.get(`products/?search=${query}`)
                }
            }
            else {
                if (query) {
                    response = await api.get(`products/?region=${selectedRegId}&category=${selectedCategory}&search=${query}`)
                }
                else {
                   response =  await api.get(`products/?region=${selectedRegId}&category=${selectedCategory}`)
                }
            }
            onFilter(response.data)
            console.log('resp hear - ', response.data)
        }catch(error) {
            console.error('Ошибка при выборе региона', error)
        }

        
        
    }


 

    const handleChangeSearch = (e) => {
        {
            const value = e.target.value;
            setQuery(value)
            onTextSearch(e.target.value)
            if (!value.trim())
            {
                onClear();
            }
            console.log('clear')
        
       
     }
        
        
    }

     // кнопка Найти

     const handleClick = () => {
       
        // buttonStyle()
        if (query)
        fetchProductSearch(query)
    }


  return (
    <>       
        
         <div className={styles['header']}>
            <div className={styles['header__container']}>

                <div className="search">
                    <div className={styles['search__container']}>
                            <input
                                className={styles['search__text']}
                                type="text"
                                placeholder="Поиск товара..."
                                value={query}
                                name="search"
                                onChange={handleChangeSearch}
                                onKeyDown={handleKeyDown}
                            />
                            <div className={styles['search__logo']}>
                                <img src={iconsearch} alt="" />
                            </div>
                    </div>
                </div>

                <div className={styles['btn-search']}>
                <button className={styles['btn-search__button']}  onClick={handleClick}>
                    Найти
                </button>
             </div>


                <div className={styles["region"]}>
                    <div className={styles['region__container']}>
                      
                <div className={styles['categ-add']}>
                    <div className={styles['categ-add__container']}>
                        <div className={styles['categ-add__body']}>
                            
                            <Link  className={styles['categ-add__add']} to="/add-product">Добавить товар</Link>
                        </div>
                        
                    </div>
                </div> 

                        <div className={styles['region__item']}> 
                          
                                <select name="regions" className={styles['region__list']}  value={region}
                                    onChange={ handleChange}>
                                        <option value="0">Все регионы</option>
                                        {regions.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.nameRegions}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>


                </div>



            </div>
        </div>
        <div></div>
        
        
 

        
       
        
       
    
</>

    


  );
};

export default SearchAndSort;
