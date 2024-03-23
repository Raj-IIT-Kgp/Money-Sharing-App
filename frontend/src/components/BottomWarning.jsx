import { Link } from "react-router-dom";

export function BottomWarning({ label, buttonText, to }) {
    return (
        <div className="py-2 text-sm flex justify-center items-center">
            <div className="mr-1">{label}</div>
            <Link
                to={to}
                className="text-blue-500 hover:text-blue-700 focus:text-blue-700 focus:outline-none"
            >
                {buttonText}
            </Link>
        </div>
    );
}
