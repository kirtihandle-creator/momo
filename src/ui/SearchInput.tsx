import { useId } from "react";

export function SearchInput({ value, onChange, label = "Search" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const id = useId();
  return <div><label htmlFor={id}>{label}</label><input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
