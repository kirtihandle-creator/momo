import { useId, type SelectHTMLAttributes } from "react";

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
}

export function SelectField({ label, options, id, ...props }: SelectFieldProps) {
  const generatedId = useId();
  return <div><label htmlFor={id ?? generatedId}>{label}</label><select {...props} id={id ?? generatedId}>{options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select></div>;
}
