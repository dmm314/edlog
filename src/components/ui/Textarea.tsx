import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxLength, className = "", id, value, defaultValue, ...props }, ref) => {
    const textareaId = id || props.name;
    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="label-field">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          className={`input-field resize-none ${error ? "border-red-400 focus:ring-red-400" : ""} ${className}`}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <span />
          )}
          {maxLength && (
            <p className="text-xs text-slate-400">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
