import { useCallback, useEffect, useRef, useState } from "react";

export type WidgetDialogResult = "confirmed" | "cancelled" | "dismissed";

export interface WidgetDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmWord?: string;
  onClose: (result: WidgetDialogResult) => void;
}

const RESULT_LABELS: Record<WidgetDialogResult, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled by user",
  dismissed: "Dismissed (escape or backdrop)",
};

export function WidgetDialogBody({ open, title = "Confirm widget action", description, confirmWord = "CONFIRM", onClose }: WidgetDialogProps) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canConfirm = typed.trim().toUpperCase() === confirmWord && !busy;

  useEffect(() => {
    if (!open) return;
    setTyped("");
    setBusy(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose("dismissed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const confirm = useCallback(() => {
    if (!canConfirm) return;
    setBusy(true);
    window.setTimeout(() => onClose("confirmed"), 450);
  }, [canConfirm, onClose]);

  if (!open) return null;
  return (
    <div className="widget-dialog-backdrop" onClick={() => onClose("dismissed")} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="widget-dialog-title" onClick={(e) => e.stopPropagation()} style={{ background: "white", margin: "10vh auto", maxWidth: 420, padding: 16 }}>
        <h3 id="widget-dialog-title">{title}</h3>
        {description && <p>{description}</p>}
        <label>
          Type <code>{confirmWord}</code> to continue
          <input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirm()} />
        </label>
        <footer style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => onClose("cancelled")} disabled={busy}>Cancel</button>
          <button type="button" onClick={confirm} disabled={!canConfirm}>{busy ? "Working..." : "Confirm"}</button>
        </footer>
      </div>
    </div>
  );
}

export function WidgetDialog() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<WidgetDialogResult[]>([]);
  const handleClose = useCallback((result: WidgetDialogResult) => {
    setOpen(false);
    setHistory((prev) => [result, ...prev].slice(0, 5));
  }, []);
  const confirmedCount = history.filter((r) => r === "confirmed").length;
  const lastResult = history[0] ?? null;

  return (
    <section className="widget-dialog-demo">
      <h2>Widget Dialog</h2>
      <button type="button" onClick={() => setOpen(true)}>Open widget dialog</button>
      <p>{confirmedCount} confirmed of {history.length} recent attempts</p>
      <p aria-live="polite">Last result: {lastResult ? RESULT_LABELS[lastResult] : "none yet"}</p>
      <ol>
        {history.map((r, idx) => <li key={idx}>{RESULT_LABELS[r]}</li>)}
      </ol>
      <WidgetDialogBody open={open} onClose={handleClose} description="This will permanently change the widget." />
    </section>
  );
}










export default WidgetDialog;
