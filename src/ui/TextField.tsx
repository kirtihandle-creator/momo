import { useId, type InputHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string }

export function TextField({ label, error, id, "aria-describedby": describedBy, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const description = [describedBy, error ? `${inputId}-error` : undefined].filter(Boolean).join(" ") || undefined;
  return <div><label htmlFor={inputId}>{label}</label><input {...props} id={inputId} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={description} />{error && <p id={`${inputId}-error`}>{error}</p>}</div>;
}
