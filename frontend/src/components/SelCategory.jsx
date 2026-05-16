
import { useState, useEffect, useRef } from "react";
import styles from "./SelCategory.module.css";
import useDictionary from "./store/useDictionary";
import { useProductFilter } from "./store/useProductFilter";

const SelCategory = () => {
    const [expandedParentId, setExpandedParentId] = useState(null);
    const [highlightedParentId, setHighlightedParentId] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const { categories, fetchCategories } = useDictionary();
    const {
        category,
        setCategory,
        fetchProducts,
        region,
        query
    } = useProductFilter();

    const categoryRefs = useRef({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const visibleCategories = showAll ? categories : categories.slice(0, 20);

    const handleParentClick = async (parentId) => {
        const isSame = category === parentId;

        if (isSame) {
            // снять выделение
            setExpandedParentId(null);
            setHighlightedParentId(null);
            setCategory(null);
        } else {
            setExpandedParentId(parentId);
            setHighlightedParentId(parentId);
            setCategory(parentId);
        }

        await fetchProducts(); // загрузка товаров с обновлёнными фильтрами
    };

    const handleSubClick = async (subId, parentId) => {
        setCategory(subId);
        setExpandedParentId(parentId);
        setHighlightedParentId(parentId);

        await fetchProducts();
    };

    const shouldShowBlock = (catId) => {
        if (!highlightedParentId && !expandedParentId && !category) return true;
        const activeId = highlightedParentId ?? expandedParentId ?? category;
        return catId === activeId;
    };

    return (
        <div  className={styles["category-buttons"]} >
            <div  
             className={styles["category-buttons-wrapper"]}>
                {visibleCategories.map((cat, index) => {
                    const isExpanded = expandedParentId === cat.id;
                    const isHighlighted = highlightedParentId === cat.id;
                    const isSubSelected = cat.subcategories?.some(sub => sub.id === category);

                    
                    // console.log('selectedCategory - ', selectedCategory)
                   
                   
                  
                    

                	if (!shouldShowBlock(cat.id) ) return null;
                  
                    return (
                        <div   ref={(el) => {
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
                                    ${ category === cat.id ? styles.active : ""}`}
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
                                                category === sub.id ? styles.active :""
                                            }`}
                                            onClick={() => handleSubClick(sub.id, cat.id)}
                                        >
                                            {sub.CategoryName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                       
                    )
                   
                })}  
                {
                    categories.length >= 20 && (
                        <button
                            className={styles['showMoreBtn']}
                            onClick={() => setShowAll(prev => !prev)}
                        >
                            {showAll ? 'Скрыть':'Показать все'}

                        </button>
                    )
                }
    
                 
            </div>        </div>
    );
};

export default SelCategory;







// import { useProductFilter } from "./store/useProductFilter";
// import styles from "./SelCategory.module.css";
// import { useState } from "react";
// import { useRef } from "react";

// export default function SelCategory({categories, className }) {
//   const { category, setCategory } = useProductFilter();
//   const [expandedParentId, setExpandedParentId] = useState(null);
//     const [highlightedParentId, sethighlightedParentId] = useState(null)
//     const [showAll, setShowAll] = useState(false)



//   const visibleCategories = showAll ? categories : categories.slice(0, 20)

//   const handleSelect = (value) => {
//     setCategory(value);
//   };

  
//   	const shouldShowBlock = (catId) => {
// 		if (!highlightedParentId && !expandedParentId && !category) return true;
// 		const activeId = highlightedParentId ?? expandedParentId ?? category;
// 		// показываем только родителя
// 		return catId === activeId;
// 	}

//     const categoryRefs = useRef({})

//   return (
//     // <select
//     //   className={className}
//     //   value={category || ""}
//     //   onChange={(e) => handleSelect(e.target.value)}
//     // >
//     //   <option value="">Все категории</option>
//     //   <option value="1">Телефоны</option>
//     //   <option value="2">Ноутбуки</option>
//     //   <option value="3">Одежда</option>
//     //   {/* ...подставь свои категории */}
//     // </select>

//      <div  className={styles["category-buttons"]} >
//             <div  
//              className={styles["category-buttons-wrapper"]}>
//                 {visibleCategories.map((cat, index) => {
//                     const isExpanded = expandedParentId === cat.id;
//                     const isHighlighted = highlightedParentId === cat.id;
//                     const isSubSelected = cat.subcategories?.some(sub => sub.id === category);

                    
//                     // console.log('selectedCategory - ', selectedCategory)
                   
                   
                  
                    

//                 	if (!shouldShowBlock(cat.id) ) return null;
                  
//                     return (
//                         <div   ref={(el) => {
// 							if  (el)	(categoryRefs.current[cat.id] = el);
// 								else delete categoryRefs.current[cat.id];
// 							}} 
						
// 						key={cat.id} 
//                         className={`${styles['category-block']} 
//                         ${isHighlighted  ? styles.active :''}` } >
                           
//                              {/* Родительская категория */}
                           
//                            {   (
//                                 <button
//                                     className={`${styles["category-btn"]}
//                                     ${ (isHighlighted)  ? styles.fullWidth:""} 
//                                     ${ category === cat.id ? styles.active : ""}`}
//                                     // {...console.log('inside in sub - ')}
//                                     onClick={() => handleParentClick(cat.id)}
//                                     onDoubleClick={() => doubleClickCat(cat.id)}
//                                 >
//                                     {cat.CategoryName}
//                                 </button>  
//                              )
//                             }
//                             {/* Подкатегории   */}

//                             { (isExpanded && cat.subcategories?.length > 0) && (
//                                 <div className={styles['subcategory-wrapper']}>
//                                     {cat.subcategories.map((sub) => (
//                                         <button 
//                                             key={sub.id} 
//                                             className={`${styles['subcategory-btn']} ${
//                                                 selectedCategory === sub.id ? styles.active :""
//                                             }`}
//                                             onClick={() => hanldeSubClick(sub.id, cat.id)}
//                                         >
//                                             {sub.CategoryName}
//                                         </button>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
                       
//                     )
                   
//                 })}  
//                 {
//                     categories.length >= 20 && (
//                         <button
//                             className={styles['showMoreBtn']}
//                             onClick={() => setShowAll(prev => !prev)}
//                         >
//                             {showAll ? 'Скрыть':'Показать все'}

//                         </button>
//                     )
//                 }
    
                 
//             </div>
//         </div>




//   );
// }




// import { useState, useEffect, useRef } from "react";
// import styles from "./SelCategory.module.css";
// import useDictionary from "./store/useDictionary";
// import { useProductFilter } from "./store/useProductFilter";

// const SelCategory = () => {
//     const [expandedParentId, setExpandedParentId] = useState(null);
//     const [highlightedParentId, setHighlightedParentId] = useState(null);
//     const [showAll, setShowAll] = useState(false);

//     const { categories, fetchCategories } = useDictionary();
//     const {
//         category,
//         setCategory,
//         fetchProducts,
//         region,
//         query
//     } = useProductFilter();

//     const categoryRefs = useRef({});

//     useEffect(() => {
//         fetchCategories();
//     }, []);

//     const visibleCategories = showAll ? categories : categories.slice(0, 20);

//     const handleParentClick = async (parentId) => {
//         const isSame = category === parentId;

//         if (isSame) {
//             // снять выделение
//             setExpandedParentId(null);
//             setHighlightedParentId(null);
//             setCategory(null);
//         } else {
//             setExpandedParentId(parentId);
//             setHighlightedParentId(parentId);
//             setCategory(parentId);
//         }

//         await fetchProducts(); // загрузка товаров с обновлёнными фильтрами
//     };

//     const handleSubClick = async (subId, parentId) => {
//         setCategory(subId);
//         setExpandedParentId(parentId);
//         setHighlightedParentId(parentId);

//         await fetchProducts();
//     };

//     const shouldShowBlock = (catId) => {
//         if (!highlightedParentId && !expandedParentId && !category) return true;
//         const activeId = highlightedParentId ?? expandedParentId ?? category;
//         return catId === activeId;
//     };

//     return (
//         <div className={styles["category-buttons"]}>
//             <div className={styles["category-buttons-wrapper"]}>
//                 {visibleCategories.map((cat) => {
//                     const isExpanded = expandedParentId === cat.id;
//                     const isHighlighted =
//                         highlightedParentId === cat.id ||
//                         cat.id === category ||
//                         cat.subcategories?.some(sub => sub.id === category);

//                     if (!shouldShowBlock(cat.id)) return null;

//                     return (
//                         <div
//                             key={cat.id}
//                             ref={(el) => {
//                                 if (el) categoryRefs.current[cat.id] = el;
//                                 else delete categoryRefs.current[cat.id];
//                             }}
//                             className={`${styles["category-block"]} ${
//                                 isHighlighted ? styles.active : ""
//                             }`}
//                         >
//                             {/* Родительская категория */}
//                             <button
//                                 className={`
//                                     ${styles["category-btn"]}
//                                     ${isHighlighted ? styles.fullWidth : ""}
//                                     ${category === cat.id ? styles.active : ""}
//                                 `}
//                                 onClick={() => handleParentClick(cat.id)}
//                             >
//                                 {cat.CategoryName}
//                             </button>

//                             {/* Подкатегории */}
//                             {isExpanded && cat.subcategories?.length > 0 && (
//                                 <div className={styles["subcategory-wrapper"]}>
//                                     {cat.subcategories.map((sub) => (
//                                         <button
//                                             key={sub.id}
//                                             className={`
//                                                 ${styles["subcategory-btn"]}
//                                                 ${category === sub.id ? styles.active : ""}
//                                             `}
//                                             onClick={() =>
//                                                 handleSubClick(sub.id, cat.id)
//                                             }
//                                         >
//                                             {sub.CategoryName}
//                                         </button>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     );
//                 })}

//                 {categories.length > 20 && (
//                     <button
//                         className={styles["showMoreBtn"]}
//                         onClick={() => setShowAll((prev) => !prev)}
//                     >
//                         {showAll ? "Скрыть" : "Показать все"}
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default SelCategory;