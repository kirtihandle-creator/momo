import type { ReactNode } from "react";

export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details open={defaultOpen || undefined}><summary>{title}</summary>{children}</details>;
}
