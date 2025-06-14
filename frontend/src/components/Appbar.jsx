import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";

export const Appbar = () => {
    const [name, setName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef();
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
                const token = localStorage.getItem("token");
                const response = await axios.get(`${backendUrl}/user/info`, {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });
                if (response.status === 200 && response.data.user) {
                    setName(response.data.user.firstName);
                    setProfileImage(response.data.user.profileImage);

                } else {
                    console.log("Error in fetching user info");
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/signin");
    };

    const handleUpdate = () => {
        navigate("/update");
    };

    const appbarStyle = {
        backgroundColor: '#1a202c',
        color: 'white',
        boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
    };

    const logoStyle = {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginRight: '2rem'
    };

    const userInfoStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative'
    };

    const avatarStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#3182ce',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1rem',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden'
    };

    const avatarImgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
    };

    const menuStyle = {
        position: 'absolute',
        top: '50px',
        right: 0,
        background: 'white',
        color: '#1a202c',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 100,
        minWidth: '120px',
        padding: '0.5rem 0'
    };

    const menuItemStyle = {
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontSize: '1rem',
        border: 'none',
        background: 'none',
        width: '100%',
        textAlign: 'left'
    };

    return (
        <div style={appbarStyle}>
            <div
                style={logoStyle}
                onClick={() => navigate("/dashboard")}
                className="cursor-pointer select-none"
            >
                RajPay
            </div>
            <Button
                onClick={() => navigate("/transaction")}
                label="Transaction History"
                className="w-auto min-w-fit"
            />
            <Button
                onClick={() => navigate("/chatpage")}
                label="Message"
                className="w-auto min-w-fit"
                style={{ marginLeft: "1rem" }}
            />
            <div style={{ flex: 1 }} />
            <div style={userInfoStyle} ref={menuRef}>
                <div
                    style={avatarStyle}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {profileImage
                        ? <img src={profileImage} alt="Profile" style={avatarImgStyle} />
                        : name.charAt(0)
                    }
                </div>
                {menuOpen && (
                    <div style={menuStyle}>
                        <button style={menuItemStyle} onClick={handleUpdate}>Update</button>
                        <button style={menuItemStyle} onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
        </div>
    );
};