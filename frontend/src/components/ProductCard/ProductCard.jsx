import api from "../../api/axios";

const ProductCard = () => {
    const handleAddToBookmarks = async () => {
        try {
            await api.post('bookmarks/', {
                product:product.id}
            )
            alert ('Добавлено в избранное')
        }
        catch(error) {
            console.error('Ошибка добавления в избранное', error)
            alert('Ошибка. Возможно, вы не авторизованы или уже добавлено')
        }
    }


    return (
        <div>
            <h3>{product.productName}</h3>
            <button onClick={handleAddToBookmarks}>💖 В избранное</button>
        </div>
    )

}
export default ProductCard;