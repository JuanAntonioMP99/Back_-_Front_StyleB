import "./Input.css";

export default function Input({
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
    disabled = false,
    className = "",
    id,
    name,
    required = false,
    ...rest
}) {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-group ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className="input-field"
                {...rest}
            />
        </div>
    );
}
