import RegionChat from "./RegionChat";
import { useState } from "react";


 const ChatWrapper = ({ regions }) => {
    // const [regionId, setRegionId] = useState("0");

    return (
        <RegionChat
            regionId={regionId}
            regions={regions}
            onSelectRegion={setRegionId}
        />
    );
}

export default ChatWrapper;