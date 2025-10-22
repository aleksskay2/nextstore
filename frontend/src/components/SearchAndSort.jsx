import { use, useEffect, useState } from "react";
import api from "../api/axios";
import styles from "./SearchAndSort.module.css";
import iconsearch from "../assets/images/LetterS.png";
import { Link } from "react-router-dom";
import addPlus from "../assets/icons/add_insert_plus_1588.png";

import useDictionary from "./store/useDictionary";
import RegionSelect from "./UI/RegionSelect";
import  useStore  from "./store/store"      


const SearchAndSort = ({
    onTextSearch,
    onRegionSelect,
    selectedCategory,
    onFilter, // 🔥 пустая функция по умолчанию
    onResults,
    onClear,
}) => {
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState("");
    // const [regions, setRegions] = useState([]);
    const [regId, setRegId] = useState();
    
    const { regions, fetchRegions } = useDictionary();
    const {activeFilter, setActiveFilter} = useStore();


    // Получение списка регионов
    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchProducts = async (searchTerm, regionId) => {
        try {
            let url = `/products/?search=${searchTerm}&ordering=price`;
            if (regionId) {
                url += `&region=${regionId}`;
            }

            const response = await api.get(url);
            onResults(response.data);
        } catch (error) {
            console.error("Ошибка при поиске товаров", error);
        }
    };

    const fetchProductSearch = async () => {
        try {
            console.log("fetchProds regId = ", regId);
            let response;
            if (regId) {
                response = await api(`products/?region=${regId}`, {
                    params: {
                        search: query,
                        ordering: "price",
                    },
                });
            } else {
                response = await api(`products/`, {
                    params: {
                        search: query,

                        ordering: "price",
                    },
                });
            }

            onResults(response.data);
        } catch (error) {
            console.error("error in SearchAndSort", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchProductSearch();
        }
    };


    // выбор региона
    const searchRegions = async () => {
      
        //     { 
        //     try { let response; if (region === "0") 
        //         { if (query) { response = await api.get( 
        //             `products/?category=${selectedCategory}&search=${query}` ); }
        //              else if (selectedCategory) { response = 
        //                 await api.get( `products/?category=${selectedCategory}` ); }
        //               else { response = await api.get(`products/?search=${query}`); } }
        //                else { if (query) 
        //                 { response = 
        //                     await api.get( `products/?region=${region}&category=${selectedCategory}&search=${query}` ); }
        //                      else { response = await api.get( `products/?region=${region}&category=${selectedCategory}` ); } }
        //                       onFilter(response.data); console.log("resp hear - ", response.data); } 
        // catch (error) { console.error("Ошибка при выборе региона", error); } };

        try {
            let response;
            let url = ''
            if (region === "0") {
                if (query) {
                   
                    url = `products/?category=${selectedCategory}&search=${query}`
                    
                } else if (selectedCategory) {
                    
                    url = `products/?category=${selectedCategory}`
                    
                } else {
                    url = `products/?search=${query}`;
                }
            } else {
                if (query) {
                  
                    url = `products/?region=${region}&category=${selectedCategory}&search=${query}`
                    
                } else {
                 
                    url = `products/?region=${region}&category=${selectedCategory}`
                    
                }
            }
            response = await api.get(url)

            onFilter(response.data);
            console.log("resp hear - ", response.data);
        } catch (error) {
            console.error("Ошибка при выборе региона", error);
        }
    };

    const handleChange = async (selectedOption) => {
        // const selectedRegId = e.target.value;
        const selectedRegId = selectedOption;
        onRegionSelect(selectedRegId);
        console.log("selectionRegid in SearchAndSort", selectedOption);
        setRegion(selectedRegId);
        try {
           
            let url = `products/?type=${activeFilter}`
            if (selectedRegId === "0") {
                if (query) {
                   
                       url += `&category=${selectedCategory}&search=${query}`;
                    
                } else if (selectedCategory) {
                   
                     url += `&category=${selectedCategory}`
                   
                } else {
                   url += `&search=${query}`
                //    /api/products/?type=all&region=2&category=null HTTP/1.1" 500 169688
                }
            } else {
                if (selectedCategory)
                     url += `&region=${selectedRegId}&category=${selectedCategory}&search=${query}`
                if (query) {
                    
                     url += `&region=${selectedRegId}&category=${selectedCategory}&search=${query}`
                   
                } else {
                   
                     url +=  `&region=${selectedRegId}&category=${selectedCategory}`
                    
                }

            }
            const response = await api.get(url)
            onFilter(response.data);
            console.log("resp hear - ", response.data);
        } catch (error) {
            console.error("Ошибка при выборе региона", error);
        }
    };

    const handleChangeSearch = (e) => {
        
        const value = e.target.value;
        setQuery(value);
        onTextSearch(e.target.value);
        // if (!value.trim())
        // {
        //     onClear();
        // }
        console.log("clear");
        
    };

    // кнопка Найти

    const handleClick = () => {
        // buttonStyle()
        if (query) searchRegions();
        // fetchProductSearch()
    };

    return (
        <>
            <div className={styles["header"]}>
                <div className={styles["header__container"]}>
                    <div className="search">
                        <div className={styles["search__container"]}>
                            <input
                                className={styles["search__text"]}
                                type="text"
                                placeholder="Поиск товара..."
                                value={query}
                                name="search"
                                onChange={handleChangeSearch}
                                onKeyDown={handleKeyDown}
                            />
                            <div className={styles["search__logo"]}>
                                <img src={iconsearch} alt="" />
                            </div>
                        </div>
                    </div>

                    <div className={styles["btn-search"]}>
                        <button
                            className={styles["btn-search__button"]}
                            onClick={handleClick}
                        >
                            Найти
                        </button>
                    </div>

                    <div className={styles["region"]}>
                        <div className={styles["region__container"]}>
                            <div className={styles["categ-add"]}>
                                <div className={styles["categ-add__container"]}>
                                    <div className={styles["categ-add__body"]}>
                                        <Link
                                            className={styles["categ-add__add"]}
                                            to="/add-product"
                                        >
                                            <img
                                                className={
                                                    styles[
                                                        "categ-add__add-photo"
                                                    ]
                                                }
                                                src={addPlus}
                                                alt=""
                                            />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className={styles["region__item"]}>
                                {/* {  <select  name="regions" className={styles['region__list']}  value={region}
                                    onChange={ handleChange}>
                                        <option value="0">Все регионы</option>
                                        {regions.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.nameRegions}
                                        </option>
                                    ))}
                            </select>  } */}
                                <RegionSelect
                                    regions={regions}
                                    value={regId}
                                    onChange={handleChange}
                                />
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
