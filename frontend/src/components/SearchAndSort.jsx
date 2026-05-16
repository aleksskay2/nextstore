

// import { use, useEffect, useState } from "react";
import api from "../api/axios";
import styles from "./SearchAndSort.module.css";
import iconsearch from "../assets/images/LetterS.png";
import { Link } from "react-router-dom";
import addPlus from "../assets/icons/add_insert_plus_1588.png";

import useDictionary from "./store/useDictionary";
import RegionSelect from "./UI/RegionSelect";
import useStore from "./store/store";
import { useProductFilter } from "./store/useProductFilter";
import { useState, useEffect } from "react";

const SearchAndSort = (
    
) => {
    const [query, setQuery] = useState("");
    // const [region, setRegion] = useState("");
    // const [regions, setRegions] = useState([]);
    const [regId, setRegId] = useState();
    // const [sortBy, setSortBy] = useState("price");
    
    const {regions, fetchRegions, IsloadingRegions} = useDictionary()

  
    const {
        search,
        setSearch,
        region,
        setRegion,
      
        setSortBy,
        minPrice,
        maxPrice,
        setMinPrice,
        setMaxPrice,
        fetchProducts
    } = useProductFilter();

     // const { activeFilter, setActiveFilter } = useStore();
   
    // const [minPrice, setMinPrice] = useState("");
    // const [maxPrice, setMaxPrice] = useState("");
    const [selectedOptionValue, setSelectedOptionValue] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);
    const [showFilter, setShowFilter] = useState(false);

   const { sortBy, toggleSortPrice } = useProductFilter();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 500);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

   

     // load regions
    useEffect(() => {
        fetchRegions();
        console.log('regions', regions);
        setSearch(query);
        fetchProducts(false)
        
    }, []);

    // react to filters
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(false);
        }, 200);
        return () => clearTimeout(timer);
    }, [search, region, sortBy, minPrice, maxPrice]);

    // sorting handlers
 

    const sortRating = () => {
        setSortBy(
            sortBy === "product_rating"
                ? "-product_rating"
                : "product_rating"
        );
    };

    const handleClickRating = (e) => {
        setSortBy("product_rating");
    };
    const handleClickPrice = (e) => {
        setSortBy("price");
    };

   
    // const handleChangeSearch = (e) => {
    //     const value = e.target.value;
    //     setQuery(value);
    //     onTextSearch(e.target.value);
    //     // if (!value.trim())
    //     // {
    //     //     onClear();
    //     // }
    //     console.log("clear");
    // };

    const handleChangeSearch = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (!value.trim()) {
            setSearch("");      // очистить фильтр в Zustand
            fetchProducts(false); // перезагрузить все товары
        }
    };


    // кнопка Найти

    const handleSearchClick = async () => {
        setSearch(query);
        await fetchProducts(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearchClick();
        }
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
                        name="search"
                        value={query}
                        onChange={handleChangeSearch}
                        onKeyDown={handleKeyDown}
                    />
                    <div className={styles["search__logo"]}>
                        <img src={iconsearch} alt="" />
                    </div>
                </div>
            </div>

            {/* Поиск по цене, рейтингу,  */}


            {/* ⚙️ Сортировка по цене и рейтингу */}
            <div className={styles["search-parametr"]}>
                <div className={styles["search-parametr__container"]}>
                    <label
                        onClick={toggleSortPrice}
                        className={styles["search-parametr__item"]}
                    >
                        <input
                            type="checkbox"
                            name="price"
                            checked={sortBy === "-price" || sortBy === 'price'}
                        />
                        по цене
                    </label>
                    <label
                        onClick={sortRating}
                        className={styles["search-parametr__item"]}
                    >
                        <input
                            type="checkbox"
                            name="product_rating"
                            checked={sortBy === "product_rating" ||
                                    sortBy === "-product_rating" 
                            }
                        /> по рейтингу </label>


                    {isMobile ? (
                <span
                    onClick={() => setShowFilter(!showFilter)}
                    className={styles["price-filter__label"]}
                >
                    фильтр
                </span>
            ) : (
                <div className={styles["price-range"]}>
                    <div className={ styles["price-range__max"]} >
                        от
                        <input
                            type="number"
                            placeholder="Мин"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>
                    
                    <div className={ styles["price-range__min"]} >
                        до
                    <input
                        type="number"
                        placeholder="Макс"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                    </div>
                    
                </div>
            )}

            </div>

                    
                </div>

                    {showFilter && (
                                
                            <div className={styles["price-range"]}>
                                от
                                <div
                                    className={
                                        styles["price-range__min"]
                                    }
                                >
                                    <input
                                        type="number"
                                        name="price__max"
                                        placeholder="Мин"
                                        value={minPrice}
                                        onChange={(e) =>
                                            setMinPrice(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className={ styles["price-range__max"]}
                                > до
                                <input
                                    type="number"
                                    name="price__min"
                                    placeholder="Макс"
                                    value={maxPrice}
                                    onChange={(e) =>
                                        setMaxPrice(
                                            e.target.value
                                        )
                                    }
                                />
                                </div>
                            </div>
                            )}

                {/* Поиск по цене - минимум, максимум */}

                
            </div>

            <div className={styles["btn-search"]}>
                <button
                    className={styles["btn-search__button"]}
                    
                    

                        onClick={handleSearchClick}
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
                        <RegionSelect
                            regions={regions}
                            region={region}
                           
                        />
                    </div>
                </div>
            </div>
        </div>
    
</>
    );
};

export default SearchAndSort;


