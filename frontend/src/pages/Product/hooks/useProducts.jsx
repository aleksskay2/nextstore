import { useEffect, useState } from "react";
import api from "../../../api/axios";

const useProducts = (initialUrl) => {
    const [productsAll, setProductsAll] = useState([])
    const [nextUrl, setNextUrl] = useState(initialUrl)
    const [loading, setLoading] = useState(false);

    const loadProducts = async (URL, append = false) => {
        if (!URL ) return;
        setLoading(true)
        try {
            const res = await api.get(URL)
            setProductsAll((prev) => (
                append ? [...prev, ...res.data.results] : res.data.results
            ))
            setNextUrl(res.data.next)
        }
        catch(error)
        {
            console.error('Ошибка при получении товаров', error)
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProducts(initialUrl)
    }, [initialUrl])

    return {productsAll, nextUrl, loadMore: () => loadProducts(nextUrl, true), loading};

}

export default useProducts;