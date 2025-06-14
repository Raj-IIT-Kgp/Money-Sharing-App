import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ChatPage() {
    const ws = useWebSocket();
    const [convoUsers, setConvoUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [myUser, setMyUser] = useState(null);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("token");
    const query = useQuery();
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Fetch current user info
    useEffect(() => {
        fetch(`${API_URL}/user/info`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMyUser(data.user));
    }, [token]);

    // Fetch users I have chatted with
    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/message/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async data => {
                const userIds = data.users || [];
                const userProfiles = await Promise.all(
                    userIds.map(async (id) => {
                        const res = await fetch(`${API_URL}/user/bulk?filter=`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const usersData = await res.json();
                        return (usersData.users || []).find(u => u._id === id);
                    })
                );
                // Remove duplicates by _id
                const uniqueUsers = [];
                const seen = new Set();
                for (const u of userProfiles.filter(Boolean)) {
                    if (!seen.has(u._id)) {
                        uniqueUsers.push(u);
                        seen.add(u._id);
                    }
                }
                setConvoUsers(uniqueUsers);
            });
    }, [token]);

    // Only set selectedUserId from query param if not already set, then remove param
    useEffect(() => {
        const userId = query.get("id");
        if (userId && !selectedUserId && token) {
            const already = convoUsers.find(u => u && u._id === userId);
            if (already) {
                setSelectedUserId(userId);
                navigate("/chatpage", { replace: true });
            } else {
                fetch(`${API_URL}/user/bulk?filter=`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        const user = (data.users || []).find(u => u._id === userId);
                        if (user) {
                            setConvoUsers(prev => {
                                if (prev.some(u => u._id === user._id)) return prev;
                                return [...prev, user];
                            });
                            setSelectedUserId(userId);
                        }
                        navigate("/chatpage", { replace: true });
                    });
            }
        }
    }, [query, token, convoUsers, selectedUserId, navigate]);

    // Search bar: always search all users except self
    useEffect(() => {
        if (!search) {
            setSearchResults([]);
            return;
        }
        fetch(`${API_URL}/user/bulk?filter=${encodeURIComponent(search)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setSearchResults((data.users || []).filter(u => u._id !== myUser?._id));
            });
    }, [search, token, myUser]);

    // Fetch chat history
    useEffect(() => {
        if (!selectedUserId) return;
        fetch(`${API_URL}/message/history/${selectedUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMessages(data.messages || []));
    }, [selectedUserId, token]);

    // Listen for incoming WebSocket messages
    useEffect(() => {
        if (!ws || !ws.current || !myUser) return;
        const handleMessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (
                    (msg.from === selectedUserId && msg.to === myUser._id) ||
                    (msg.from === myUser._id && msg.to === selectedUserId)
                ) {
                    setMessages(prev => [...prev, msg]);
                }
            } catch (e) {}
        };
        ws.current.addEventListener("message", handleMessage);
        return () => {
            ws.current && ws.current.removeEventListener("message", handleMessage);
        };
    }, [ws, selectedUserId, myUser]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // When user clicks a search result, add to sidebar if not present and select (no duplicates)
    const handleSelectUser = (user) => {
        setConvoUsers(prev => {
            if (prev.some(u => u._id === user._id)) return prev;
            return [...prev, user];
        });
        setSelectedUserId(user._id);
        setSearch(""); // clear search
        setSearchResults([]);
        navigate("/chatpage", { replace: true }); // Always erase params
    };

    // When user clicks a sidebar user, switch and remove params
    const handleSidebarUserClick = (userId) => {
        setSelectedUserId(userId);
        navigate("/chatpage", { replace: true }); // Always erase params
    };

    // Always get selected user object from convoUsers
    const selectedUser = convoUsers.find(u => u._id === selectedUserId);

    // Ensure switching works even if user is just added
    useEffect(() => {
        if (selectedUserId && !selectedUser) {
            // Try to find in searchResults and add if not present
            const user = searchResults.find(u => u._id === selectedUserId);
            if (user) {
                setConvoUsers(prev => {
                    if (prev.some(u => u._id === user._id)) return prev;
                    return [...prev, user];
                });
            }
        }
    }, [selectedUserId, selectedUser, searchResults]);

    // Add emoji to input
    const addEmoji = (emoji) => {
        setInput(input + emoji.native);
        setShowEmoji(false);
    };

    // Send file
    const sendFile = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedUserId || !myUser) return;
        const formData = new FormData();
        formData.append("to", selectedUserId);
        formData.append("file", file);

        const res = await fetch(`${API_URL}/message/send-file`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.msg) {
            setMessages(prev => [...prev, data.msg]);
            if (ws && ws.current && ws.current.readyState === 1) {
                ws.current.send(JSON.stringify({
                    ...data.msg,
                    isFile: true
                }));
            }
        }
        fileInputRef.current.value = "";
    };

    // Send message
    const sendMessage = () => {
        if (!input.trim() || !selectedUserId || !myUser) return;
        fetch(`${API_URL}/message/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ to: selectedUserId, content: input })
        });
        if (ws && ws.current && ws.current.readyState === 1) {
            ws.current.send(JSON.stringify({
                from: myUser._id,
                to: selectedUserId,
                content: input
            }));
        }
        setInput("");
    };

    return (
        <div style={{ display: "flex", height: "100vh", background: "#f0f2f5" }}>
            {/* Sidebar */}
            <div style={{
                width: 280,
                borderRight: "1px solid #e0e0e0",
                background: "#fff",
                display: "flex",
                flexDirection: "column"
            }}>
                <div style={{
                    padding: "20px 16px 8px 16px",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#075e54",
                    borderBottom: "1px solid #e0e0e0"
                }}>
                    My Chats
                </div>
                <div style={{ padding: "12px 16px 8px 16px", position: "relative" }}>
                    <input
                        placeholder="Search users by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 20,
                            border: "1px solid #e0e0e0",
                            outline: "none",
                            background: "#f6f6f6"
                        }}
                    />
                    {search && searchResults.length > 0 && (
                        <ul style={{
                            position: "absolute",
                            top: 44,
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: 8,
                            zIndex: 10,
                            maxHeight: 220,
                            overflowY: "auto",
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            {searchResults.map(u => (
                                <li
                                    key={u._id}
                                    style={{
                                        cursor: "pointer",
                                        padding: "8px 12px",
                                        borderBottom: "1px solid #f0f0f0"
                                    }}
                                    onClick={() => handleSelectUser(u)}
                                >
                                    <span>{u.firstName} {u.lastName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, overflowY: "auto" }}>
                    {convoUsers.map(u => (
                        <li
                            key={u._id}
                            style={{
                                cursor: "pointer",
                                background: selectedUserId === u._id ? "#e7fbe7" : "transparent",
                                borderRadius: 8,
                                margin: "2px 8px",
                                padding: "8px 10px",
                                display: "flex",
                                alignItems: "center",
                                transition: "background 0.2s"
                            }}
                            onClick={() => handleSidebarUserClick(u._id)}
                        >
                            <img
                                src={u.profileImage || ""}
                                alt=""
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    marginRight: 12,
                                    background: "#eee"
                                }}
                                onError={e => { e.target.src = ""; }}
                            />
                            <span style={{ fontWeight: 500, fontSize: 16 }}>
                                {u.firstName} {u.lastName}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Main Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ece5dd" }}>
                {/* AppBar */}
                <div style={{
                    height: 64,
                    background: "#075e54",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 24px",
                    fontWeight: 500,
                    fontSize: 20,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                }}>
                    <span style={{ fontWeight: 700, marginRight: 24 }}>Paytm Chat</span>
                    {selectedUser && (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <img
                                src={selectedUser.profileImage || ""}
                                alt=""
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    marginRight: 10,
                                    background: "#eee"
                                }}
                                onError={e => { e.target.src = ""; }}
                            />
                            <span style={{ fontSize: 17 }}>
                                {selectedUser.firstName} {selectedUser.lastName}
                            </span>
                        </div>
                    )}
                    {/* Go to Dashboard button */}
                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{
                            marginLeft: "auto",
                            background: "#fff",
                            color: "#075e54",
                            border: "none",
                            borderRadius: 20,
                            padding: "8px 20px",
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
                {/* Messages */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "32px 0 16px 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        {messages.map((msg, i) => {
                            const isMe = msg.from === myUser?._id;
                            // If message has fileUrl, show as link
                            if (msg.fileUrl) {
                                return (
                                    <div key={i} style={{ textAlign: isMe ? "right" : "left", margin: "8px 24px" }}>
                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                                            display: "inline-block",
                                            background: isMe ? "#dcf8c6" : "#fff",
                                            padding: "10px 16px",
                                            borderRadius: 12,
                                            color: "#075e54",
                                            textDecoration: "underline",
                                            maxWidth: 320,
                                            wordBreak: "break-all"
                                        }}>
                                            📎 {msg.fileName || "File"}
                                        </a>
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={i}
                                    style={{
                                        textAlign: isMe ? "right" : "left",
                                        margin: "8px 24px"
                                    }}
                                >
                                    <div style={{
                                        display: "inline-block",
                                        background: isMe ? "#dcf8c6" : "#fff",
                                        padding: "10px 16px",
                                        borderRadius: 12,
                                        color: "#222",
                                        maxWidth: 320,
                                        wordBreak: "break-word"
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                {/* Input */}
                {selectedUser && (
                    <div style={{
                        padding: "12px 24px",
                        borderTop: "1px solid #e0e0e0",
                        background: "#f7f7f7",
                        display: "flex",
                        alignItems: "center",
                        position: "relative"
                    }}>
                        <button
                            onClick={() => setShowEmoji(!showEmoji)}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: 24,
                                marginRight: 8,
                                cursor: "pointer"
                            }}
                        >😊</button>
                        {showEmoji && (
                            <div style={{ position: "absolute", bottom: 60, left: 0, zIndex: 100 }}>
                                <Picker data={data} onEmojiSelect={addEmoji} />
                            </div>
                        )}
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                padding: "12px 18px",
                                borderRadius: 24,
                                border: "1px solid #e0e0e0",
                                fontSize: 16,
                                outline: "none",
                                background: "#fff",
                                marginRight: 12
                            }}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={sendFile}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                background: "#fff",
                                color: "#075e54",
                                border: "none",
                                borderRadius: 24,
                                padding: "10px 16px",
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: "pointer",
                                marginRight: 8
                            }}
                        >📎</button>
                        <button
                            onClick={sendMessage}
                            style={{
                                background: "#25d366",
                                color: "#fff",
                                border: "none",
                                borderRadius: 24,
                                padding: "10px 28px",
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: "pointer"
                            }}
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}