import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label-field">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${error ? "input-error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: "var(--warning)" }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
