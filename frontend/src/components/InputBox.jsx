
export function InputBox({ label, placeholder, onChange }) {
    return (
        <div className="flex flex-col mb-4">
            <label htmlFor={label} className="text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                id={label}
                type="text"
                placeholder={placeholder}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
            />
        </div>
    );
}
