import { useEffect, useState } from "react";
import axios from "axios";

export const Appbar = () => {
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchName = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:3000/api/v1/user/info", {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });
                if (response.status === 200) {
                    setName(response.data.firstName);
                } else {
                    console.log("Error in fetching name");
                }
            } catch (error) {
                console.error("Error fetching name:", error);
            }
        };
        fetchName();
    }, []);

    const appbarStyle = {
        backgroundColor: '#1a202c',
        color: 'white',
        boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const logoStyle = {
        fontSize: '1.5em',
        fontWeight: 'bold',
    };

    const userInfoStyle = {
        display: 'flex',
        alignItems: 'center',
    };

    const greetingStyle = {
        marginRight: '10px',
        fontSize: '1rem',
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
    };

    return (
        <div style={appbarStyle}>
            <div style={logoStyle}>RajPay</div>
            <div style={userInfoStyle}>
                <div style={greetingStyle}>Hello, </div>
                <div style={avatarStyle}>{name.charAt(0)}</div>
            </div>
        </div>
    );
};
