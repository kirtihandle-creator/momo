import { useId, type InputHTMLAttributes } from "react";

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> { label: string }

export function CheckboxField({ label, id, ...props }: CheckboxFieldProps) {
  const generatedId = useId();
  return <label htmlFor={id ?? generatedId}><input {...props} id={id ?? generatedId} type="checkbox" />{label}</label>;
}
