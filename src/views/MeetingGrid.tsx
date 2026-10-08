import { useMemo, useState } from "react";

export interface MeetingRow {
  id: number;
  label: string;
  amount: number;
  createdAt: string;
  tags: string[];
}
export type MeetingSortKey = "label" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";
export interface MeetingGridProps {
  title?: string;
  rows?: MeetingRow[];
  pageSize?: number;
  onRowClick?: (row: MeetingRow) => void;
}
const TAGS = ["meeting", "grid", "priority", "archived", "starred"];
export function seedMeetingRows(count = 13): MeetingRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const day = new Date(2026, 0, 1 + ((id * 19) % 300));
    return {
      id,
      label: `Meeting ${String(id).padStart(3, "0")}`,
      amount: Math.round(((id * 19) % 997) * 1.5),
      createdAt: day.toISOString().slice(0, 10),
      tags: TAGS.filter((_, t) => (id + t) % 3 === 0),
    };
  });
}
function compare(a: MeetingRow, b: MeetingRow, key: MeetingSortKey): number {
  if (key === "amount") return a.amount - b.amount;
  return a[key].localeCompare(b[key]);
}

export function MeetingGrid({ title = "Meeting Grid", rows, pageSize = 3, onRowClick }: MeetingGridProps) {
  const data = useMemo(() => rows ?? seedMeetingRows(), [rows]);
  const [sortKey, setSortKey] = useState<MeetingSortKey>("createdAt");
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

  const toggleSort = (key: MeetingSortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
    setPage(0);
  };
  const arrow = (key: MeetingSortKey) => (key === sortKey ? (direction === "asc" ? " ↑" : " ↓") : "");

  return (
    <section className="meeting-grid" aria-label={title}>
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

export default MeetingGrid;
