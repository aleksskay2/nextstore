import Header from "./Header/Header";
import {Link, useNavigate} from 'react-router-dom'
import BottomNavbar from './BottomNavbar/BottomNavbar'

const Layout = () => {
    return(
        <>
            {/* <Header/> */}
            {/* <Link to="products/">Список товаров</Link>| */}
            {/* <Link to="/add-product">Добавить товар</Link> */}
            <BottomNavbar/>

        </>
    )
}
export default Layout;