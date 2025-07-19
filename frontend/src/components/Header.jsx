import {Link} from 'react-router-dom'

const Header = () => {
    return (
        <nav>
            <Link to="/">Главная</Link> |
            <Link to="store-admins">Список товаров</Link>|
            <Link to="/add-product">Добавить товар</Link>
        </nav>
    )
  
}
export default Header;