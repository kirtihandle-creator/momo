import type { ReactNode } from "react";

export function EmptyState({ message = "No items to display.", action }: { message?: string; action?: ReactNode }) {
  return <div style={{ padding: 24, textAlign: "center" }}><p>{message}</p>{action}</div>;
}
