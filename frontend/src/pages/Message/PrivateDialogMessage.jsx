import { useState , useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const PrivateDialogMessage = () => {
    

    
const navigate = useNavigate();
    const [dialogs, setDialogs] = useState([]);
     const { id } = useParams();

    useEffect(() => {
        const loadDialogs = async () => {
            try {
                const res = await api.get(`/private-chat/${id}`);
                setDialogs(res.data);
                console.log('RES IN PRIVATEDIALOG_MESSAGE', res.data)
            } catch (e) {
                console.log("Ошибка загрузки диалогов:", e);
            }
        };

        loadDialogs();
    }, []);


    return (
        <div>

        </div>
    )
}
export default PrivateDialogMessage;