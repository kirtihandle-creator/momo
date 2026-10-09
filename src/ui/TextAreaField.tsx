import { useId, type TextareaHTMLAttributes } from "react";

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label: string }

export function TextAreaField({ label, id, ...props }: TextAreaFieldProps) {
  const generatedId = useId();
  return <div><label htmlFor={id ?? generatedId}>{label}</label><textarea {...props} id={id ?? generatedId} /></div>;
}
