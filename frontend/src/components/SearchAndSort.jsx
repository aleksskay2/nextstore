import { useEffect, useState } from "react";
import api from "../api/axios";
import styles from './SearchAndSort.module.css'

const SearchFilterSort = ({ onFilter, onResults, onClear}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState([]);

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

  // Дебаунс для query

   useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
            
        }, (500));
        return () => clearTimeout(timer);
    }, [query])


  
    
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

    const handleClick = () => {
        fetchProductSearch()
    }

    const fetchProductSearch = async () => {
        try {
            const response = await api('products/', {
                params:{
                        search:query,
                        ordering:'price'
                    }
            }
            )      
            onResults(response.data);
        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
    }


    const handleChangeSearch = (e) => {
        setQuery(e.target.value)   
        if (!(e.target.value))
        onClear() 
    }


    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchProductSearch()
        }
    };


    const handleChange = async (e) => {
        if (query)
        {
            setRegion(e.target.value)
        }
        else {
            const regionId = e.target.value;
            console.log('regionId', regionId)
           
            if (regionId) {
                const response = await api.get(`products/?region=${regionId}`);
                onFilter(response.data)
            }
            else {
                const response = await api.get('products/')
                onFilter(response.data)
            }    
        }
        
    }




  return (
    <div  className="container">
        <div>
            <select className={styles}  value={region} onChange={(e) => handleChange(e)}>
                <option value="">Все регионы</option>
                {regions.map((r) => (
                <option key={r.id} value={r.id}>
                    {r.nameRegions}
                </option>
                ))}
            </select>
        </div>
 


        <input
            type="text"
            placeholder="Поиск товара..."
            value={query}
            onChange={(e) =>  handleChangeSearch(e) }
            onKeyDown={handleKeyDown}
        />
        
        <div>
            <button onClick={handleClick}>
                Найти
            </button>
        </div>
    

    </div>


  );
};

export default SearchFilterSort;
