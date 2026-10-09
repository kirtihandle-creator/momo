import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const background = { neutral: "#eee", success: "#dcfce7", warning: "#fef3c7" }[tone];
  return <span style={{ background, color: "#111", borderRadius: 12, padding: "2px 8px" }}>{children}</span>;
}
