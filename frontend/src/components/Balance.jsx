
export const Balance = ({ value }) => {
    return (
        <div className="flex items-center">
            <div className="font-bold text-lg mr-2">Your Balance:</div>
            <div className="font-semibold text-lg text-blue-600">
                Rs {value}
            </div>
        </div>
    );
};
