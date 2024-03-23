import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/v1/account/transactions', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // replace 'token' with the key you use to store the token
                    }
                });
                setTransactions(res.data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="max-w-4xl w-full mx-auto">
                <h1 className="text-4xl font-bold mt-12 mb-8 text-center">Transactions</h1>
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="w-full table-auto">
                        <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                            <th className="py-3 px-4 text-left">From</th>
                            <th className="py-3 px-4 text-left">To</th>
                            <th className="py-3 px-4 text-center">Amount</th>
                            <th className="py-3 px-4 text-center">Date</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700">
                        {transactions.map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="py-3 px-4">{transaction.fromFullName}</td>
                                <td className="py-3 px-4">{transaction.toFullName}</td>
                                <td className="py-3 px-4 text-center">
                                        <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
                                            {transaction.amount}
                                        </span>
                                </td>
                                <td className="py-3 px-4 text-center">{new Date(transaction.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="text-center py-4">
                        <button onClick={() => navigate("/dashboard")}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Transactions;
