import { useMemo, useState } from "react";

export interface AnswerRow {
  id: number;
  label: string;
  amount: number;
  createdAt: string;
  tags: string[];
}
export type AnswerSortKey = "label" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";
export interface AnswerExplorerProps {
  title?: string;
  rows?: AnswerRow[];
  pageSize?: number;
  onRowClick?: (row: AnswerRow) => void;
}
const TAGS = ["answer", "explorer", "priority", "archived", "starred"];
export function seedAnswerRows(count = 14): AnswerRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const day = new Date(2026, 0, 1 + ((id * 13) % 300));
    return {
      id,
      label: `Answer ${String(id).padStart(3, "0")}`,
      amount: Math.round(((id * 13) % 997) * 1.5),
      createdAt: day.toISOString().slice(0, 10),
      tags: TAGS.filter((_, t) => (id + t) % 3 === 0),
    };
  });
}
function compare(a: AnswerRow, b: AnswerRow, key: AnswerSortKey): number {
  if (key === "amount") return a.amount - b.amount;
  return a[key].localeCompare(b[key]);
}

export function AnswerExplorer({ title = "Answer Explorer", rows, pageSize = 6, onRowClick }: AnswerExplorerProps) {
  const data = useMemo(() => rows ?? seedAnswerRows(), [rows]);
  const [sortKey, setSortKey] = useState<AnswerSortKey>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const [tag, setTag] = useState<string | null>(null);
  const filtered = useMemo(() => (tag ? data.filter((r) => r.tags.includes(tag)) : data), [data, tag]);
  const sorted = useMemo(() => {
    const copy = [...filtered].sort((a, b) => compare(a, b, sortKey));
    return direction === "asc" ? copy : copy.reverse();
  }, [filtered, sortKey, direction]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(current * pageSize, current * pageSize + pageSize);
  const total = useMemo(() => filtered.reduce((sum, r) => sum + r.amount, 0), [filtered]);
  const maxAmount = useMemo(() => filtered.reduce((m, r) => Math.max(m, r.amount), 0), [filtered]);

  const toggleSort = (key: AnswerSortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
    setPage(0);
  };
  const arrow = (key: AnswerSortKey) => (key === sortKey ? (direction === "asc" ? " ↑" : " ↓") : "");

  return (
    <section className="answer-explorer" aria-label={title}>
      <h2>{title}</h2>
      <p>{filtered.length} rows, total {total.toLocaleString()}, max {maxAmount.toLocaleString()}</p>
      <nav>
        <button type="button" onClick={() => { setTag(null); setPage(0); }} disabled={tag === null}>all</button>
        {TAGS.map((t) => <button key={t} type="button" onClick={() => { setTag(t); setPage(0); }} disabled={tag === t}>{t}</button>)}
      </nav>
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort("label")}>Label{arrow("label")}</th>
            <th onClick={() => toggleSort("amount")}>Amount{arrow("amount")}</th>
            <th onClick={() => toggleSort("createdAt")}>Created{arrow("createdAt")}</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)}>
              <td>{row.label}</td>
              <td>{row.amount.toLocaleString()}</td>
              <td>{row.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={current === 0}>prev</button>
        <span>page {current + 1} of {pageCount}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={current >= pageCount - 1}>next</button>
      </footer>
    </section>
  );
}

export default AnswerExplorer;
