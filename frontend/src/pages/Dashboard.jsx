import { Balance } from "../components/Balance";
import { Users } from "../components/Users";
import { Appbar } from "../components/Appbar.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.jsx";

export const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBalance = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch("http://localhost:3000/api/v1/account/balance", {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });
                if (response.status === 200) {
                    const data = await response.json();
                    setBalance((data.balance).toFixed(2));
                } else {
                    console.log("Error in fetching balance");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        };
        fetchBalance();
    }, []);

    const handleLoginToAnotherAccount = () => {
        // Navigate to the sign-in page
        navigate("/signin");
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Appbar />
            <div className="container mx-auto mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white shadow-md rounded-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Account Balance</h2>
                        <Balance value={balance} />
                    </div>
                    <div className="bg-white shadow-md rounded-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Users</h2>
                        <Users />
                    </div>
                </div>
                <div className="mt-8 flex justify-between">
                    <Button onClick={() => navigate("/update")} label="Update Profile" />
                    <Button onClick={() => navigate("/transaction")} label="Transaction History" />
                    <Button onClick={handleLoginToAnotherAccount} label="Log in to Another Account" />
                </div>
            </div>
        </div>
    );
};
