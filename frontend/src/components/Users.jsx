import { useEffect, useState } from "react";
import { Button } from "./Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
                const response = await axios.get(`${backendUrl}/user/bulk?filter=${filter}`, {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });
                setUsers(Array.isArray(response.data.users) ? response.data.users : []);
            } catch (error) {
                setUsers([]);
            }
        };
        fetchUsers();
    }, [filter]);

    return (
        <>
            <div className="font-bold mt-6 text-lg">Users</div>
            <div className="my-2">
                <input
                    onChange={(e) => setFilter(e.target.value)}
                    type="text"
                    placeholder="Search users..."
                    className="w-full px-2 py-1 border rounded border-slate-200"
                />
            </div>
            <div>
                {users.map(user => <User key={user._id} user={user} />)}
            </div>
        </>
    );
};

function User({ user }) {
    const navigate = useNavigate();

    const handleSendMoney = () => {
        navigate(`/send?id=${user._id}&name=${user.firstName}`);
    };

    const handleMessage = () => {
        navigate(`/chatpage?id=${user._id}&name=${user.firstName}`);
    };

    return (
        <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
                <div className="rounded-full h-12 w-12 bg-slate-200 flex justify-center items-center mt-1 mr-2 overflow-hidden">
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt="Profile"
                            className="h-12 w-12 object-cover rounded-full"
                        />
                    ) : (
                        <div className="flex flex-col justify-center h-full text-xl">
                            {user.firstName?.[0] || "?"}
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center h-full">
                    <div>
                        {user.firstName} {user.lastName}
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-center h-full gap-2">
                <Button
                    onClick={handleSendMoney}
                    label="Send Money"
                />
                <Button
                    onClick={handleMessage}
                    label="Message"
                />
            </div>
        </div>
    );
}