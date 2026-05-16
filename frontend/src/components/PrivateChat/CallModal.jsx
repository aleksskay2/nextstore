// CallModal.jsx
import React, { useEffect } from "react";
import { cn } from "../../utils/cn";

export default function CallModal({
    incomingCall,
    callMode,
    onAccept,
    onDecline,
    onEnd,
    inCall,
    
   
    
}) {

  

    if (!incomingCall && !inCall) return null;

    return (
        <div style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "#fff",
            borderRadius: 10,
            padding: 20,
            zIndex: 1000,
            width: 260,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
        }}>

           

            {incomingCall && (
                <p>Входящий {callMode === "video" ? "видеозвонок" : "аудиозвонок"}...</p>
            )}

            

            <div style={{ display: "flex", gap: 10 }}>
                {incomingCall && (
                    <>
                        <button onClick={onAccept} style={{ flex: 1, background: "green", color: "#fff" }}>
                            Принять
                        </button>
                        <button onClick={onDecline} style={{ flex: 1, background: "red", color: "#fff" }}>
                            Отклонить
                        </button>
                    </>
                )}

                {inCall && (
                    <button onClick={onEnd} style={{ width: "100%", background: "red", color: "#fff" }}>
                        Завершить
                    </button>
                )}
            </div>
        </div>
    );
}
