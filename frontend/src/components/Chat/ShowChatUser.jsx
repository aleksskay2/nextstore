import react, { useEffect } from 'react'
import { useState } from 'react'
import styles from './ShowChatUser.module.css'
import RegionSelect from '../UI/RegionSelect';
// import { useProductFilter } from '../store/useProductFilter';
import RegionChat from '../RegionChat';
import SearchUser from '../../pages/Message/SearchUser';
import { useUiStore } from '../store/useUiStore';


const ShowChatUser = () => {
    
const [showSearch, setShowSearch] = useState(true)
// const {region, setRegion} = useProductFilter;
const activeTab = useUiStore((s) => s.activeTab);
const setActiveTab = useUiStore((s) => s.setActiveTab);


useEffect(() => {
    setActiveTab('chat')
}, [])
const handleClickSearch = () => {
    setActiveTab('search')
    setShowSearch(false)
}
const handleClickChat = () => {
    setActiveTab('chat')
    setShowSearch(true)
    
}

return (
    <>
     
    <RegionChat/>
                      


             
               
    </>
    
    

    )
}

export default ShowChatUser