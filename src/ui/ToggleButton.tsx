import { Button } from "./Button";

export function ToggleButton({ label, pressed, onChange, disabled = false }: { label: string; pressed: boolean; onChange: (pressed: boolean) => void; disabled?: boolean }) {
  return <Button aria-pressed={pressed} disabled={disabled} onClick={() => onChange(!pressed)}>{label}</Button>;
}
