import type { ReactNode } from "react";

export function DefinitionList({ items }: { items: readonly { id: string; label: string; value: ReactNode }[] }) {
  return <dl>{items.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
