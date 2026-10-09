import { useId } from "react";

export function ProgressBar({ value, max = 100, label = "Progress" }: { value?: number; max?: number; label?: string }) {
  const id = useId();
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const progress = value === undefined || !Number.isFinite(value) ? undefined : Math.min(limit, Math.max(0, value));
  return <div><label htmlFor={id}>{label}</label><progress id={id} max={limit} value={progress} /></div>;
}
