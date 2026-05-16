import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import ProductItem from "../Product/ProductItem";
import styles from "./MyProducts.module.css";
import MyProductItem from "./MyProductItem";

const MyProducts = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get("my-products/");

            setProducts(response.data);
            console.log('res in MyProducts - ', response.data)
        } catch (error) {
            console.error("error", error);
        }
    };

    // Удаление товара из пункта Мои товары
    const handleDelete = async (id) => {
        try {
            await api.delete(`my-products/${id}`);
            setProducts(products.filter((prod) => prod.id != id));
        } catch (error) {
            console.error("error", error);
            if (error.response?.status === 401) {
                navigate("/login");
            }
        }
    };

    const navigate = useNavigate();

    return (
        <div className={styles["product__container"]}>
            <h2>Ваш товар</h2>
            <div className={styles["product__body"]}>
                <div className={styles["product__row"]}>
                    {products.map((product) => (
                        <MyProductItem
                            deleteProd={handleDelete}
                            key={product.id}
                            product={product}
                        />
                    ))}

                    {/* {console.log("nextUrl", nextUrl)} */}
                </div>
            </div>
        </div>
    );
};

export default MyProducts;
