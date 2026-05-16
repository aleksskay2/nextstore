import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "./ProductItemVip.module.css";
import delIcon from "../../assets/images/deletePng.png";
import comment from "../../assets/icons/comment.png";
import { useState } from "react";
import api from "../../api/axios";
import SmoothStar from "../../components/UI/SmoothStar";

const ProductItemVip = ({ deleteProd, product, onBookmarkChange }) => {
    const [isBookmark, setIsBookmark] = useState(product.is_bookmark);
    const [messageText, setMessageText] = useState("");

    const toggleBookmark = async (productId, isBookmark) => {
        const newState = !isBookmark;

        setIsBookmark(newState);

        try {
            const token = localStorage.getItem("access");
            if (!token) {
                alert(
                    "Только авторизованные пользователи могут доваблять в избранное"
                );
                return;
            }

            if (isBookmark) {
                await api.delete(`bookmarks/remove${productId}/`);
                console.log("work delete");
            } else {
                await api.post("bookmarks/add/", { product: productId });
            }
            onBookmarkChange(product.id, newState);
        } catch (error) {
            console.error("Ошибка при изменении избранного:", error);
        }
    };

    const navigate = useNavigate();

    const handleProductDetail = () => {
        sessionStorage.setItem("scrollPosition", window.scrollY);
    };

    return (
        <div className={styles["product__item"]}>
            {/* {
                                (!(products.length)) && (
                                    <div className={styles['product__count']}>
                                        Нет товара
                                    </div>
                                )
                            } */}

            <Link
                onClick={handleProductDetail}
                to={`/products/${product.id}`}
                className={styles["item-product"]}
                key={product.id}
            >
                <div className={styles["item-product__content"]}>
                    <div className={styles["item-product__img-content"]}>
                        {product.main_image_webp ? (
                            <div className={styles["item-product__image"]}>
                                <img
                                    loading="lazy"
                                    src={product.main_image_webp}
                                    alt=""
                                />
                            </div>
                        ) : (
                            <div>Нет фото</div>
                        )}

                        <div className={styles["item-product__info"]}>
                            <div
                                className={styles["item-product__product-name"]}
                            >
                                {product.productName}
                            </div>
                            <div className={styles["item-product__weight"]}>
                                {product.weight}
                            </div>

                            {/* <div className={styles[""]}>
                                {product.productUser}
                            </div> */}

                            

                           

                            
                        </div>
                    </div>

                     {/* <div className={styles["item-product__bookmark"]}
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleBookmark(
                                        product.id,
                                        product.is_bookmark
                                    );
                                }}
                                
                            >
                        
                         {product.is_bookmark ? (
                        <FaHeart color="red" />
                        ) : (
                            <FaRegHeart color="black" />
                        )}
                     
                        </div> */}

                   
                   
                    
                </div>

                <div className={styles["item-product__img-price"]}>
                        <div className={styles["item-product__price-rating"]}>
                            <div className={styles["item-product__price"]}>
                                <div className="price__title">
                                     {Math.round(product.price)} &#8381;
                                </div>

                                 {/* {product.productUser === "user" && (
                                <div className={styles["item-product__btns"]}>
                                    <button
                                        className={styles["item-product__edit"]}
                                        onClick={() =>
                                            navigate(
                                                `/edit-user-product/${product.id}`
                                            )
                                        }
                                    >
                                        ...
                                    </button>
                                    <button
                                        className={
                                            styles["item-product__delete"]
                                        }
                                        onClick={() => deleteProd(product.id)}
                                    >
                                        <img src={delIcon} alt="" />
                                    </button>
                                </div>
                            )} */}

                               
                            </div>
                           
                            {/* {( product.product_rating > 0) && (
                                <div className={styles["item-product__rating"]}>
                                    <span
                                        className={styles["item-product__star"]}
                                    >
                                        <SmoothStar />
                                    </span>

                                    {product.product_rating}
                                    <div
                                        className={
                                            styles["item-product__review"]
                                        }
                                    >
                                        <div
                                            className={
                                                styles["rating__comment"]
                                            }
                                        >
                                            <img src={comment} alt="" />
                                        </div>
                                        <div>
                                            {product.reviews.length} отзыва
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </div>
                
            </Link>
        </div>
    );
};

export default ProductItemVip;
