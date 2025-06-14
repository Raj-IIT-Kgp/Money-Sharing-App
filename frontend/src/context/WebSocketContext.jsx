// WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const ws = useRef(null);

    useEffect(() => {
        console.log("🔌 Connecting to WebSocket...");
        try {
            ws.current = new WebSocket("wss://money-sharing-app.onrender.com/ws");

            ws.current.onopen = () => {
                console.log("✅ WebSocket connected");
                ws.current.send("Hello from frontend");
            };

            ws.current.onmessage = (event) => {
                console.log("📨 Message from server:", event.data);
            };

            ws.current.onerror = (err) => {
                console.error("❌ WebSocket error:", err);
            };

            ws.current.onclose = () => {
                console.warn("⚠️ WebSocket disconnected");
            };
        } catch (e) {
            console.error("❌ Error while opening WebSocket:", e);
        }

        return () => {
            console.log("🧹 Cleaning up WebSocket...");
            ws.current?.close();
        };
    }, []);


    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
