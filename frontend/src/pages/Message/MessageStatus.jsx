import {BiCheck, BiCheckDouble} from 'react-icons/bi'

const MessageStatus = ({isRead}) => {
    return (
        <span style={{fontSize:'14px', color:isRead ? 'blue':'gray'}}>
            {isRead ? <BiCheckDouble/>: <BiCheck/>}
        </span>
    )
}
export default MessageStatus;