




import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "./ProductItem.module.css";
import delIcon from "../../assets/images/deletePng.png";
import comment from "../../assets/icons/comment.png";
import SmoothStar from "../../components/UI/SmoothStar";
import { useProductFilter } from "../../components/store/UseProductFilter"
import { useEffect, useState } from "react";
import api from "../../api/axios";

const ProductItem = ({ deleteProd, product }) => {

   const navigate = useNavigate();

    // Zustand store
    const { isBookmarked, toggleBookmark, products } = useProductFilter();

   
    const handleProductDetail = () => {
        sessionStorage.setItem("scrollPosition", window.scrollY);
    };

    const { deleteProduct } = useProductFilter();

    useEffect(() => {

    }, [products.is_bookmark])

    useEffect(() => 
        { console.log('product updated ', product)  }
        , 
        [product] )


    return (
        <div className={styles["product__item"]}>
            <Link
                onClick={handleProductDetail}
                to={`/products/${product.id}`}
                className={styles["item-product"]}
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
                            <div className={styles["item-product__product-name"]}>
                                {product.productName}
                            </div>
                            <div className={styles["item-product__weight"]}>
                                {product.weight}
                            </div>
                            {/* <div>{product.productUser}</div> */}
                            <div className={styles["item-product__store-name"]}>
                                 магазин: {product.storeName}
                            </div>
                            <div className={styles["item-product__region"]}>
                                {product.region}
                            </div>
                        </div>
                    </div>

                    {/* ИЗБРАННОЕ — теперь через Zustand */}
                    <div
                        className={styles["item-product__bookmark"]}
                        onClick={(e) => {
                            e.preventDefault();
                            alert('sdf')
                            toggleBookmark(product.id);
                        }}
                    >
                        {product.is_bookmark ? (
                            <FaHeart color="red" />
                        ) : (
                            <FaRegHeart color="black" />
                        )}
                    </div>
                </div>

                <div className={styles["item-product__img-price"]}>
                    <div className={styles["item-product__price-rating"]}>
                        
                        <div className={styles["item-product__price"]}>
                            <div className="price__title">
                                {Math.round(product.price)} ₽
                            </div>

                            {product.productUser === "user" && (
                                <div className={styles["item-product__btns"]}>
                                    <button
                                        className={styles["item-product__edit"]}

                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/edit-user-product/${product.id}`);
                                        }}
                                    >
                                        ...
                                    </button>

                                    <button
                                        className={styles["item-product__delete"]}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteProduct(product.id);
                                        }}
                                    >
                                        <img src={delIcon} alt="" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Рейтинг
                        {product.product_rating > 0 && (
                            <div className={styles["item-product__rating"]}>
                                <span className={styles["item-product__star"]}>
                                    <SmoothStar />
                                </span>

                                {product.product_rating}
                                <div className={styles["item-product__review"]}>
                                    <img src={comment} alt="" />
                                    <div>{product.reviews.length} отзывов</div>
                                </div>
                            </div>
                        )} */}

                        


                        {( product.product_rating > 0) && (
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
                            )}



                    </div>
                </div>

                <div className={styles["item-product__address"]}>
                    {product.address}
                </div>
            </Link>
        </div>
    );
};

export default ProductItem;








