import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import backArrow from "../../assets/icons/arrow_back.svg";

import ProductReviews from "../../components/ProductReviews";
import ProductGallery from "../../components/ProductGallery/ProductGallery";

import useStore from "../../components/store/store";
import styles from "./ProductDetail.module.css";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const navigate = useNavigate();
    const { messageFirst, setMessageFirst } = useStore();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`products/${id}/`);
                setProduct(response.data);
                console.log("res - detail - ", response.data);
            } catch (error) {
                console.error("Ошибка при загрузке деталей товара:", error);
            }
        };
        fetchProduct();
    }, [id]);

    if (!product) return <p>Загрузка...</p>;

    const handleGoBack = () => {
        if (window.history.length > 2) navigate(-1);
        else {
            navigate("/");
        }
    };

    const pageMessage = () => {
        navigate(`/messages/${product.id}`);
        setMessageFirst(true);
    };

    return (
        <>
        <div className="back-buttons">
            <div className="back-buttons__btn">
                <button onClick={handleGoBack}>
                    <img src={backArrow} width={20} alt="" />
                </button>
            </div>
        </div>

        <div className={styles["detail"]}>
            <div className={styles["detail__container"]}>
                <div className={styles["detail__title"]}>
                    <h2>{product.Name}</h2>
                </div>
                <div className={styles["detail__image-price-name"]}>
                    {
                        <div className={styles["detail__image"]}>
                            {product.images.length !== 0 ? (
                                <ProductGallery images={product.images} />
                            ) : (
                                <img
                                    src={product.main_image}
                                    alt=""
                                    width={90}
                                />
                            )}
                        </div>
                    }
                    <div className={styles["detail__price"]}>
                        {product.price}
                    </div>
                    <div className={styles["detail__name"]}>
                        {product.productName}
                    </div>
                </div>


            
                <div className={styles["detail__desc product-desc"]}>
                    <div className={styles["desc__address"]}>
                        {product.address}
                    </div>
                    <div className={styles["desc_product-name"]}>
                        {product.storeName}
                    </div>
                      {console.log('prodUser - ', product.productUser)}
                    <div className={styles["desc__owner-name"]}>
                        продавец :
                        {product.owner_info !== null ? (
                            <div>
                                <div
                                    className={styles["desc__username"]}
                                >
                                    {product.owner_info.username}
                                </div>
                                <div
                                    className={
                                        styles["desc__phone-message"]
                                    }
                                >
                                    {product.owner_info !== null ? (
                                        <div
                                            className={
                                                styles[
                                                    "desc__phone-number"
                                                ]
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    (window.location.href = `tel:${product.owner_info.phone}`)
                                                }
                                            >
                                                Позвонить
                                            </button>
                                        </div>
                                    ) : (
                                        <div>Нет номера продавца</div>
                                    )}
                                  
                                    

                                    <div
                                        className={
                                            styles["desc__phone-write"]
                                        }
                                    >
                                        <button
                                            style={{
                                                display: "block",
                                                backgroundColor:
                                                    "lightblue",
                                            }}
                                            onClick={() =>
                                                navigate(
                                                    `/chat/${product.id}`
                                                )
                                            }
                                        >
                                            Написать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>Нет имени продавца</div>
                        )}

                        {

                                        (product.productUser ==='user') &&
                                        (
                                        <div
                                            className={
                                                styles[
                                                    "desc__phone-number"
                                                ]
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    (window.location.href = `tel:${product.user_phone}`)
                                                }
                                            >
                                                Позвонить
                                            </button>
                                        </div>)
                                    }
                    </div>
                    <div className="product-desc__text">
                        {product.description !== "null" &&
                            product.description}
                    </div>
                </div>
                

                {/* { <Message product={product} /> } */}
                <ProductReviews productId={product.id} />
            </div>
        </div>
        </>
    );
};

export default ProductDetail;
