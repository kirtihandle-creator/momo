export function LoadingIndicator({ label = "Loading…" }: { label?: string }) {
  return <p role="status">{label}</p>;
}
