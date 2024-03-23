import { useState } from "react";
import axios from "axios";
import { InputBox } from "../components/InputBox.jsx";
import { useNavigate } from "react-router-dom";

export const Update = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName && !lastName && !password) {
            alert("Please enter at least one field to update");
            return;
        }
        const token = localStorage.getItem("token");
        try {
            const response = await axios.put("http://localhost:3000/api/v1/user/update", {
                firstName,
                lastName,
                password
            }, {
                headers: {
                    Authorization: "Bearer " + token
                }
            });
            if (response.data.message) {
                alert(response.data.message);
            }

        } catch (error) {
            alert("Error while updating information");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="max-w-md w-full p-6 bg-white rounded shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="firstName" className="block text-gray-700">First Name:</label>
                        <InputBox
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-gray-700">Last Name:</label>
                        <InputBox
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700">Password:</label>
                        <InputBox
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-3 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                        Update
                    </button>
                </form>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full mt-2 px-3 py-2 text-white bg-gray-500 rounded hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};
