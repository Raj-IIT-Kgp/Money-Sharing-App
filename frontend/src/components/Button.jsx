export const Button = ({ onClick, label, style = {}, className = "" }) => (
    <button
        onClick={onClick}
        style={{ ...style, width: "auto" }} // Ensure width is auto
        className={className}
    >
        {label}
    </button>
);