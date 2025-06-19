import { useState } from "react";
import { BottomWarning } from "../components/BottomWarning";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Signin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [otpMode, setOtpMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();

    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:3000/api/v1";

    const handlePasswordSignin = async () => {
        try {
            const response = await axios.post(
                `${backendUrl}/user/signin`,
                { username, password }
            );
            localStorage.setItem("token", response.data.token);
            alert(response.data.message);
            navigate("/dashboard");
        } catch (e) {
            alert("Not able to sign in");
        }
    };

    const handleRequestOtp = async () => {
        try {
            await axios.post(`${backendUrl}/user/signin/request-otp`, { username });
            setOtpSent(true);
            alert("OTP sent to your email");
        } catch (e) {
            alert("Failed to send OTP");
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const response = await axios.post(`${backendUrl}/user/signin/verify-otp`, { username, otp });
            localStorage.setItem("token", response.data.token);
            alert(response.data.message);
            navigate("/dashboard");
        } catch (e) {
            alert("Invalid or expired OTP");
        }
    };

    return (
        <div className="bg-slate-300 h-screen flex justify-center">
            <div className="flex flex-col justify-center">
                <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
                    <Heading label={"Sign in"} />
                    <SubHeading label={"Enter your credentials to access your account"} />
                    <InputBox onChange={e => setUsername(e.target.value)} placeholder="raj@gmail.com" label={"Email"} />
                    {!otpMode && (
                        <>
                            <InputBox onChange={e => setPassword(e.target.value)} placeholder="123456" label={"Password"} />
                            <div className="pt-4">
                                <Button onClick={handlePasswordSignin} label={"Sign in with Password"} />
                            </div>
                            <div className="pt-2">
                                <Button onClick={() => setOtpMode(true)} label={"Sign in with OTP"} />
                            </div>
                        </>
                    )}
                    {otpMode && (
                        <>
                            {!otpSent ? (
                                <div className="pt-4">
                                    <Button onClick={handleRequestOtp} label={"Send OTP to Email"} />
                                    <div className="pt-2">
                                        <Button onClick={() => setOtpMode(false)} label={"Back to Password Login"} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <InputBox onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" label={"OTP"} />
                                    <div className="pt-4">
                                        <Button onClick={handleVerifyOtp} label={"Verify OTP & Sign in"} />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/signup"} />
                </div>
            </div>
        </div>
    );
};