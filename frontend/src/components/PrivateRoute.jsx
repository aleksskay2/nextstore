import { Navigate } from "react-router-dom";

const PrivateRoute = ({children}) => {
    const token = localStorage.getItem('access')
    return token ? children : <Navigate to="/loginFrom"/>
} 

export default PrivateRoute;