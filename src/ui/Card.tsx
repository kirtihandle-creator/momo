import { useId, type ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id} style={{ border: "1px solid #aaa", borderRadius: 8, padding: 16 }}><h2 id={id}>{title}</h2>{children}</section>;
}
