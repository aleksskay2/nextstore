



import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { useProductFilter } from "../../components/store/useProductFilter";
import { useAppStore } from "../../components/store/appStore";

import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import RegionFilter from "./RegionFilter";
import ProductGrid from "./ProductGrid";
import SkeletonCard from "./SkeletonCard";
import ProductItem from "./ProductItem";
import styles from './ProductList.module.css'
import SelCategory from "../../components/SelCategory";
import useDictionary from "../../components/store/useDictionary";
import SearchAndSort from "../../components/SearchAndSort";
import useStore from "../../components/store/store";
import { useScroll } from "../../components/store/scroll";
import RegionChat from "../../components/RegionChat";
import ShowChatUser from "../../components/Chat/ShowChatUser"
import ChatWrapper from "../../components/ChatWrapper";
import { useMessageChatsStore } from "../../components/store/useMessageChatsStore";
// import useGlobalSocket from "../../hooks/useGlobalSocket";


function connect (userId) {
   
}



export default function ProductList() {
  
  const {
    search,
    category,
    region,
    loading,
    nextUrl,
    type,
    isBookmarked,
    setType,
    products,
    fetchProducts,
  } = useProductFilter();


  const [showChat, setShowChat] = useState(false);
  const [chatRegion, setChatRegion] = useState(null); 
  const {categories, fetchCategories} = useDictionary()
  const {regions, fetchRegions, IsloadingRegions} = useDictionary()
  


  const total = useProductFilter(s => s.total_unread);
  const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);

  const user = useStore((s) => s.user);
  // const userId = user.id;

    // useGlobalSocket(user?.id)

  useEffect(() => {
     if (!user) return; 
        // ← не авторизован → не запускаем
    
    fetchTotalUnread();
  }, [user]);

  
    


    // useEffect(() => {
    //     connectUnreadSetter(setUnreadRefresh); // привязка стора
    //     fetchUnreadPrivate();
    //     fetchChats();
    // }, []);



//     useEffect(() => {
//     connectUnreadSetter((newUnread) => {
//         if (!useMessageChatsStore.getState().initialized) return;
//         useMessageChatsStore.setState({ unreadPrivateTotal: newUnread });
//     });

//     const init = async () => {
//         await Promise.all([
//             fetchChats(),
//             fetchUnreadPrivate(),
//         ]);

//         useMessageChatsStore.getState().setInitialized(true);
//     };

//     init();
// }, []);

    

  useEffect(() => {
    fetchCategories();
    fetchProducts(false)  
  
  }, []);

   // --- APPLY FILTERS (search, category, region) ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category, region]);   // ← очен


  useEffect(() => {
    useAppStore.getState().setNavbarMode('default');
}, []);



  // Debounce (300ms)
  const timeoutRef = useRef(null);
  const debouncedSearch = (callback) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(callback, 300);
  };

  // Sync filters → URL
  const syncToUrl = () => {
    const params = new URLSearchParams({
      search: search || "",
      category: category || "",
      region: region || "",
    });

    window.history.pushState({}, "", "?" + params.toString());
  };

  // Infinity scroll observer
 const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextUrl) {
          fetchProducts(true);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [nextUrl]);

  


 

     const buttonStyle = (value) => ({
        backgroundColor:
            type === value ? "rgb(17 97 172)" : "rgb(186, 220, 246)",
        color: type === value ? "white" : "black",
        border: type === value ? "1px solid orange" : "none",
        borderRadius: "5px",
        gap: "20px",
    });

    const handleClick = async (value) => {
        setType(value);     // ← заменяет setActiveFilter
        setShowChat(false);

        // перезагрузка товаров после смены типа
        await fetchProducts(false);
    };

    //  Для удаления данных с productUser = 'user'
    const handleDelete = async ( id) => {
      
        try {
            await api.delete(`delete-user-product/${id}`);
            setProducts(products.filter((prod) => prod.id != id));
        } catch (error) {
            console.error("error", error);
        }
    };



     const updateBookmark = (productId, newBookmarkState) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, is_bookmark: newBookmarkState } : p
            )
        );
    };

    


  return (
    <div className={styles["product-list-container"]}>

      {/* <SearchBar /> */}

      <div className={styles["filters-wrap"]}>
        <SelCategory categories={categories} className={styles["categ-add__category"]} /> 

        <SearchAndSort />
      </div>

   

        

      <div className={styles["product__buttons-container"]}>
            <div className={styles["product__buttons"]}>

                {/* ВСЕ */}
                <button
                    className={`${styles["product__button"]} ${styles["product__buttons__all"]}`}
                    onClick={() => {handleClick("all")

                         setActiveFilter("all")
                        }
                    }
                    style={buttonStyle("all")}
                >
                    Все
                </button>

                {/* ВЛАДЕЛЬЦЫ */}
                <button
                    className={`${styles["product__button"]} ${styles["product__buttons__owners"]}`}
                    onClick={() => {handleClick("owner")
                        // setActiveFilter("owner")   
                    }
                    }
                    style={buttonStyle("owner")}
                >
                    Владельцы
                </button>

                {/* ЛЮДИ */}
                <button
                    className={`${styles["product__button"]} ${styles["product__buttons__users"]}`}
                    onClick={() => {
                      handleClick("user")
                       setActiveFilter("user") 
                    }}
                    style={buttonStyle("user")}
                >
                    Люди
                </button>

                {/* Чат */}
                <button
                    className={`${styles["product__button"]} ${styles["product__buttons__users"]}`}
                    onClick={() => {


                        handleClick("chat")
                        setChatRegion(region);
                        setShowChat(true);
                    }}
                    style={buttonStyle("chat")}
                >
                    Чат
                </button>

            </div>
        </div>

   
      

    {loading && products.length === 0 ? (
      <SkeletonCard count={8} />
    ) : (
    
      <div className={styles["product__content"]}>
                            
        {!showChat && (<div className={styles["product__row"]}>
            {products.map((product) => (
                <ProductItem
                    deleteProd={handleDelete}
                    key={product.id}
                    product={product}
                    onBookmarkChange={updateBookmark}
                />
            ))}

              {/* Показать ещё */}
          <div ref={loaderRef} style={{ height: 50 }} />

          {loading && products.length > 0 && <SkeletonCard count={2} />}
        </div>) }

            {showChat && (
              <>
                <ShowChatUser
        
                  />
                
              </>
                
            )}
                  </div>
    )}

       {/* <div ref={loaderRef} style={{ height: 40 }} />

      {loading && products.length > 0 && <SkeletonCard count={2} />}  */}
    </div>
  );
}





