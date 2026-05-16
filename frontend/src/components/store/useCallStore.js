import { create } from "zustand";

export const useCallStore = create((set, get) => ({
    wsCall: null,
    incomingOffer: null,
    pendingIce: [],
    isWSReady: false,

    pcRef: { current: null },
    incomingOfferRef: { current: null },
    pendingIceRef: { current: [] },

    initCallWS: async (currentUserId) => {
        if (!currentUserId) return;

        console.log("getCurrent - ", currentUserId);

        // Уже открыт — не пересоздаём
        if (get().wsCall) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/call/${currentUserId}/`);

        set({ wsCall: ws });

        ws.onopen = () =>{ console.log("CALL WS OPEN")
              set({ isWSReady: true });
        };
        ws.onclose = () => console.log("CALL WS CLOSED");
        ws.onerror = (e) => console.error("CALL WS ERROR", e);

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            const pcRef = get().pcRef;
            const incomingOfferRef = get().incomingOfferRef;
            const pendingIceRef = get().pendingIceRef;

            if (data.type === "offer") {
                incomingOfferRef.current = data;
                set({ incomingOffer: data });
            }

            else if (data.type === "answer") {
                console.log("ANSWER received. Current state:", pcRef.current?.signalingState);

                if (pcRef.current?.signalingState === "have-local-offer") {
                    await pcRef.current.setRemoteDescription(data.sdp);
                    console.log("Remote ANSWER applied");
                } else {
                    console.warn(
                        "Ignored ANSWER — wrong state:",
                        pcRef.current?.signalingState
                    );
                }
            }

            else if (data.type === "ice") {
                if (pcRef.current?.remoteDescription) {
                    await pcRef.current.addIceCandidate(data.candidate);
                } else {
                    console.log("ICE отложен — remoteDescription еще нет");
                    pendingIceRef.current.push(data.candidate);
                    set({ pendingIce: pendingIceRef.current });
                }
            }
        };

        return () => ws.close();
    }
}));
