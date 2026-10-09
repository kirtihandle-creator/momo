import type { ReactNode } from "react";

export function StatCard({ label, value, description }: { label: string; value: ReactNode; description?: string }) {
  return <dl><dt>{label}</dt><dd style={{ fontSize: 24, margin: 0 }}>{value}</dd>{description && <dd style={{ margin: 0 }}>{description}</dd>}</dl>;
}
