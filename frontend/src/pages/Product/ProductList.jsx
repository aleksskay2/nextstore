import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// import {ReactComponent as TrashIcon} from '../../assets/icons/basket.svg'
import api from "../../api/axios";
import EditUserProduct from "./EditUserProduct";
import SearchAndSort from "../../components/SearchAndSort";
// import RegionFilter from '../components/RegionFilter'
import SelCategory from "../../components/SelCategory";
import styles from "./ProductList.module.css";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import ProductItem from "./ProductItem";
import useStore from "../../components/store/store";
import { useScroll } from "../../components/store/scroll";

const ProductList = () => {
    const [products, setProducts] = useState([]);

    const [editId, setEditId] = useState(null);
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [textSearch, setTextSearch] = useState("");
    const [bookmarks, setBookmarks] = useState([]);

    const [nextUrl, setNextUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scrollRestored, setScrollRestored] = useState(false);

    const { activeFilter, setActiveFilter } = useStore();
    const { scrollY, setScrollY } = useScroll();

    const initialUrl = "/products/?limit=20";

    const listRef = useRef(null);

    console.log("render in ProdList");

    const loadProducts = async (URL, append = false) => {
        if (activeFilter === "user") {
            URL = "/products/?type=user";
        }
        if (append) {
            URL = nextUrl;
        }
        if (activeFilter === "owner") {
            URL = "/products/?type=owner";
        }
        if (!URL) return;
        setLoading(true);
        try {
            const res = await api.get(URL);
            if (!selectedCategory)
                setProducts((prev) =>
                    append ? [...prev, ...res.data.results] : res.data.results
                );
            setNextUrl(res.data.next);
            console.log("res.data.next in ProdList", res.data.next);
        } catch (error) {
            console.error("Ошибка при получении товаров", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts(initialUrl);
    }, []);

    useEffect(() => {
        if (!loading && products.length > 0 && !scrollRestored) {
            const savedScroll = sessionStorage.getItem("scrollPosition");

            // if (!savedScroll) {
            //     setScrollRestored(true)
            //     return;
            // }

            if (savedScroll) {
                console.log("📜 Восстанавливаю скролл на:", savedScroll);
                // немного подождём, чтобы DOM успел отрисоваться
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScroll, 10));
                }, 0);
                sessionStorage.removeItem("scrollPosition");
            }
            setScrollRestored(true); // больше не восстанавливаем повторно
        }
    }, [loading, products, scrollRestored]);

    //    const location = useLocation()

    //     // ИЗМЕНЕНО: Убрана зависимость от location.pathname — сохраняем только при unmount
    //     useEffect(() => {
    //         return () => {
    //             const pos =setScrollY(listRef.current?.scrollTop ?? 0)
    //             console.log('Сохранение scrollY:', pos, 'на пути:', location.pathname);  // ДОБАВЬ
    //         setScrollY(pos);
    //         }
    //     }, [setScrollY])  // Или [] , если setScrollY стабилен

    //     // ИЗМЕНЕНО: Добавлена зависимость от location.pathname, чтобы восстановление срабатывало при возврате на маршрут
    //     // (на всякий случай, если стор не сразу reactive)
    //     useEffect(() => {
    //         // if (!products.length || !scrollY) return
    //         // if (!listRef.current) return

    //         const raf = requestAnimationFrame(() => {
    //             listRef.current.scrollTop = scrollY
    //             setScrollY(0)
    //             console.log('Применено scrollTop:', scrollY);  // ДОБАВЬ
    //         })
    //         return () => cancelAnimationFrame(raf)
    //     }, [products, scrollY, setScrollY, location.pathname])  // Добавле

    const loadMore = () => {
        if (nextUrl) {
            loadProducts(nextUrl, true);
        }
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const handleRegionSelect = (regionId) => {
        setSelectedRegion(regionId);
    };

    const handleTextSearch = (textSearch) => {
        setTextSearch(textSearch);
    };

    const fetchProducts = async (filter) => {
        try {
            console.log("selectedCategory in ProdList- ", selectedCategory);
            let url = "products/";
            if (filter === "owner")
                url += `?type=owner&region=${selectedRegion}`;
            else if (filter === "user")
                url += `?type=user&region=${selectedRegion}`;

            if (selectedCategory) {
                if (url === "products/") {
                    if (selectedRegion === "0") {
                        url += `?category=${selectedCategory}`;
                        console.log("selReg - ", selectedRegion);
                    } else {
                        url += `?category=${selectedCategory}&region=${selectedRegion}`;
                    }
                } else {
                    if (selectedRegion === "0") {
                        url += `&category=${selectedCategory}`;
                    } else {
                        url = url.slice(0, -9);
                        if (
                            url === "products/?type=owner" ||
                            url === "products/?type=user"
                        )
                            url += `&category=${selectedCategory}&region=${selectedRegion}`;
                    }
                }
            } else {
                if (
                    (selectedRegion === "0" || selectedRegion === "") &&
                    filter === "user"
                ) {
                    url = `products/?type=user`;
                }
                if (
                    (selectedRegion === "0" || selectedRegion === "") &&
                    filter === "owner"
                ) {
                    url = `products/?type=owner`;
                }
            }

            if (textSearch) {
                if (url === "products/") {
                    url += `?search=${textSearch}`;
                } else {
                    if (
                        url === "products/?type=owner" ||
                        url === "products/?type=user"
                    ) {
                        url += `&search=${textSearch}`;
                        console.log("text url", url);
                    }
                }
            }

            console.log("url--", url);
            const response = await api.get(url);
            console.log("respList -", response.data);
            setProducts(response.data.results);
            setNextUrl(response.data.next);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRegionFilter = (filteredProducts) => {
        setProducts(filteredProducts);
    };

    useEffect(() => {
        fetchProducts(activeFilter);
        console.log("activeFilter in ProdList ", activeFilter);
    }, [activeFilter]);

    // фильтрация или поиск (SearchAndSort вызывает это)
    const handleResults = (data) => {
        if (Array.isArray(data.results)) {
            setProducts(data.results);
            setNextUrl(data.next);
        } else {
            // если вернулся массив без пагинации
            setProducts(data);
            setNextUrl(null);
        }
    };

    // Для удаления данных с productUser = 'user'
    const handleDelete = async (id) => {
        try {
            await api.delete(`delete-user-product/${id}`);
            setProducts(products.filter((prod) => prod.id != id));
        } catch (error) {
            console.error("error", error);
        }
    };

    // const handleEdit = (id) =>{
    //     setEditId(id)
    // }

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await api.get("bookmarks/", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setBookmarks(
                    response.data.map((bookmark) => bookmark.product.id)
                );
            } catch (error) {
                console.error("Ошибка при получении избранного", error);
            }
        };
        fetchBookmarks();
    }, []);

    const buttonStyle = (isActive) => ({
        // backgroundColor: activeFilter === isActive ? 'rgb(95 109 122)':'rgb(197 223 243)',
        backgroundColor:
            activeFilter === isActive ? "rgb(73 125 173)" : "rgb(197 223 243)",
        color: isActive === activeFilter ? "white" : "black",
        border: isActive === activeFilter ? "1px solid orange" : "none",
        borderRadius: "5px",
        gap: "20px",
    });

    const updateBookmark = (productId, newBookmarkState) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, is_bookmark: newBookmarkState } : p
            )
        );
    };

    const handleClearSearch = () => {
        setProducts([]);
        // fetchProducts(activeFilter)
    };

    console.log("scrollRestored before return", scrollRestored);

    return (
        <>
            <SelCategory
                selectedRegion={selectedRegion}
                onCategorySelect={handleCategorySelect}
                className={styles["categ-add__category"]}
                onResults={(results) => setProducts(results)}
                onNextUrl={(next) => setNextUrl(next)}
            />

            <SearchAndSort
                onTextSearch={handleTextSearch}
                onRegionSelect={handleRegionSelect}
                selectedCategory={selectedCategory}
                query={query}
                setQuery={setQuery}
                onFilter={handleResults}
                onResults={handleResults}
                onClear={handleClearSearch}
            />

            <div ref={listRef} className={styles["product"]}>
                <div className={styles["product__container"]}>
                    <div className={styles["product__body"]}>
                        <div className={styles["product__buttons"]}>
                            <button
                                className={`${styles["product__button"]} ${styles["product__buttons__all"]}`}
                                onClick={() => setActiveFilter("all")}
                                style={buttonStyle("all")}
                            >
                                Все
                            </button>
                            <button
                                className={`${styles["product__button"]} ${styles["product__buttons__owners"]}`}
                                onClick={() => setActiveFilter("owner")}
                                style={buttonStyle("owner")}
                            >
                                Владельцы
                            </button>
                            <button
                                className={`${styles["product__button"]} ${styles["product__buttons__users"]}`}
                                onClick={() => setActiveFilter("user")}
                                style={buttonStyle("user")}
                            >
                                Люди
                            </button>
                        </div>

                        <div className={styles["product__content"]}>
                            <div className={styles["product__row"]}>
                                {products.map((product) => (
                                    <ProductItem
                                        deleteProd={handleDelete}
                                        key={product.id}
                                        product={product}
                                        onBookmarkChange={updateBookmark}
                                    />
                                ))}

                                {/* {console.log("nextUrl", nextUrl)} */}
                                {nextUrl && (
                                    <button
                                        onClick={loadMore}
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Загрузка..."
                                            : "Показать еще"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductList;
