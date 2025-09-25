
















import { useState, useEffect, act, useSyncExternalStore } from "react";
import { useRef } from "react";
import api from "../api/axios";
import styles from "./SelCategory.module.css";
import useDictionary from "./store/useDictionary";

const SelCategory = ({
    selectedRegion,
    onCategorySelect,
    onResults,
    query,
    setQuery,
}) => {

    // const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [expandedParentId, setExpandedParentId] = useState(null);
    const [highlightedParentId, sethighlightedParentId] = useState(null)

    const {categories,  fetchCategories} = useDictionary();

    const categoryRefs = useRef({})

    useEffect(() => {
        fetchCategories();
    }, []);

    const subcateg = [];
    // const fetchCategories = async () => {
    //     try {
    //         const responseCategories = await api.get("categories/");
    //         setCategories(responseCategories.data);
    //         console.log("Cat_res - ", responseCategories.data);
    //         // for (let item of responseCategories.data)
    //         //     if (item.subcategories.length) {
    //         //         console.log("Cat_res_sub - ", item.subcategories);
    //         //         for (let itemSub of item.subcategories) {
    //         //             if (!subcateg.includes(itemSub.CategoryName))
    //         //                 subcateg.push(itemSub.CategoryName);
    //         //         }
    //         //     }
    //         // console.log("subcateg - ", subcateg);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };



    const handleParentClick = async (parentId) => {
		// toggle расскрытия
		if (expandedParentId === parentId) {
			setExpandedParentId(null)
			sethighlightedParentId(null)
			setSelectedCategory(null)
			onCategorySelect(null)
			await loadProducts(null)
		}
		else
        {
			setExpandedParentId(parentId);
			sethighlightedParentId(parentId)
			setSelectedCategory(parentId)
			onCategorySelect(parentId)
			await loadProducts(parentId)
		}
	}



	const loadProducts = async (categoryId) => {
		 try {
            let response;
            const params = {};
           


            if (categoryId) params.category = categoryId;
            if (selectedRegion && selectedRegion !== "0")
                params.region = selectedRegion;
            if (query) params.search = query;

            const queryString = new URLSearchParams(params).toString();
            // console.log("querY - ", queryString);
            const url = `/products${queryString ? `?${queryString}` : ""}`;

            response = await api.get(url);
            onResults(response.data);
            // console.log("cat in SelCategory - ", selectedCategory);
            // console.log("res in SelCategory - ", response.data);
        } catch (error) {
            console.error("Ошибка при выборе категории", error);
        }
	}
    
	const hanldeSubClick = async (subId, parentId) => {
		setSelectedCategory(subId)
		sethighlightedParentId(parentId)
		setExpandedParentId(parentId)
		onCategorySelect(subId)
		await loadProducts(subId)
	}

	// прокручиваем в центр родительский блок, когда highlightedParentId или selectedCategory поменялись
    //     useEffect(() => {
    // const idToScroll = highlightedParentId ?? selectedCategory;
    // if (!idToScroll) return;

    // const el = categoryRefs.current[idToScroll];
    // if (el && typeof el.scrollIntoView === "function") {
    //     el.scrollIntoView({
    //     behavior: "smooth",
    //     inline: "center",   // <-- по горизонтали в центр
    //     block: "nearest",   // <-- вертикаль не трогаем
    //     });
    // }
    // }, [highlightedParentId, selectedCategory]);

	// Решение какие блоки показывать:
	// если ничего не выбрано: показываем все
	// если есть highlightedParentId (т.е выбран родитель или подкатегория родителя) показываем только этот родитель
	// если есть setexpandedParentId (родитель раскрыт): показываем только этот родитель (его подкатегории)

	const shouldShowBlock = (catId) => {
		if (!highlightedParentId && !expandedParentId && !selectedCategory) return true;
		const activeId = highlightedParentId ?? expandedParentId ?? selectedCategory;
		// показываем только родителя
		return catId === activeId;
	}






    const handleSelectCategory = async (categoryId, parentId = null) => {
        let newCategid = categoryId;

        if (selectedCategory === categoryId) {
            newCategid = null;
        }


    const element = categoryRefs.current[categoryId];
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",   // <-- по вертикали в центр
                inline: "nearest", // <-- по горизонтали (если надо)
            });
         }
        setSelectedCategory(newCategid);

        onCategorySelect(newCategid);

        try {
            let response;
            const params = {};
           


            if (newCategid) params.category = newCategid;
            if (selectedRegion && selectedRegion !== "0")
                params.region = selectedRegion;
            if (query) params.search = query;

            const queryString = new URLSearchParams(params).toString();
            // console.log("querY - ", queryString);
            const url = `/products${queryString ? `?${queryString}` : ""}`;

            response = await api.get(url);
            onResults(response.data);
            // console.log("cat in SelCategory - ", selectedCategory);
            // console.log("res in SelCategory - ", response.data);
        } catch (error) {
            console.error("Ошибка при выборе категории", error);
        }
    };


    const doubleClickCat =(parentId) => {
        alert('asdf')
    }


    return (
        <div>
            <div  
             className={styles["category-buttons-wrapper"]}>
                {categories.map((cat, index) => {
                    const isExpanded = expandedParentId === cat.id;
                    const isHighlighted = highlightedParentId === cat.id;
                    const isSubSelected = cat.subcategories?.some(sub => sub.id === selectedCategory);

                    
                    // console.log('selectedCategory - ', selectedCategory)
                   
                   
                  
                    

                	if (!shouldShowBlock(cat.id) ) return null;
                  
                    return (
                        <div  ref={(el) => {
							if  (el)	(categoryRefs.current[cat.id] = el);
								else delete categoryRefs.current[cat.id];
							}} 
						
						key={cat.id} 
                        className={`${styles['category-block']} 
                        ${isHighlighted  ? styles.active :''}` } >
                           
                             {/* Родительская категория */}
                           
                           {   (
                                <button
                                    className={`${styles["category-btn"]}
                                    ${ (isHighlighted)  ? styles.fullWidth:""} 
                                    ${ selectedCategory === cat.id ? styles.active : ""}`}
                                    // {...console.log('inside in sub - ')}
                                    onClick={() => handleParentClick(cat.id)}
                                    onDoubleClick={() => doubleClickCat(cat.id)}
                                >
                                    {cat.CategoryName}
                                </button>  
                             )
                            }
                            {/* Подкатегории   */}

                            { (isExpanded && cat.subcategories?.length > 0) && (
                                <div className={styles['subcategory-wrapper']}>
                                    {cat.subcategories.map((sub) => (
                                        <button 
                                            key={sub.id} 
                                            className={`${styles['subcategory-btn']} ${
                                                selectedCategory === sub.id ? styles.active :""
                                            }`}
                                            onClick={() => hanldeSubClick(sub.id, cat.id)}
                                        >
                                            {sub.CategoryName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                       
                    )
                   
                })}  
            
    
                 
            </div>
        </div>
    );
};

export default SelCategory;
