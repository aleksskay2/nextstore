import { BiCheck, BiCheckDouble } from "react-icons/bi";

const MessageStatus = ({ isDelivered, isRead }) => {

    // ✓ отправлено
    if (!isDelivered && !isRead) {
        return (
            <span style={{ fontSize: "14px", color: "gray" }}>
                <BiCheck />
            </span>
        );
    }

    // ✓✓ доставлено (серые)
    if (isDelivered && !isRead) {
        return (
            <span style={{ fontSize: "14px", color: "gray" }}>
                <BiCheckDouble />
            </span>
        );
    }

    // ✓✓ прочитано (синие)
    if (isRead) {
        return (
            <span style={{ fontSize: "14px", color: "#2196f3" }}>
                <BiCheckDouble />
            </span>
        );
    }

    return null;
};

export default MessageStatus;
