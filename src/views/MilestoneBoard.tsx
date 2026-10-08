import { useMemo, useState } from "react";

export interface MilestoneRow {
  id: number;
  label: string;
  amount: number;
  createdAt: string;
  tags: string[];
}
export type MilestoneSortKey = "label" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";
export interface MilestoneBoardProps {
  title?: string;
  rows?: MilestoneRow[];
  pageSize?: number;
  onRowClick?: (row: MilestoneRow) => void;
}
const TAGS = ["milestone", "board", "priority", "archived", "starred"];
export function seedMilestoneRows(count = 8): MilestoneRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const day = new Date(2026, 0, 1 + ((id * 13) % 300));
    return {
      id,
      label: `Milestone ${String(id).padStart(3, "0")}`,
      amount: Math.round(((id * 13) % 997) * 1.5),
      createdAt: day.toISOString().slice(0, 10),
      tags: TAGS.filter((_, t) => (id + t) % 3 === 0),
    };
  });
}
function compare(a: MilestoneRow, b: MilestoneRow, key: MilestoneSortKey): number {
  if (key === "amount") return a.amount - b.amount;
  return a[key].localeCompare(b[key]);
}

export function MilestoneBoard({ title = "Milestone Board", rows, pageSize = 7, onRowClick }: MilestoneBoardProps) {
  const data = useMemo(() => rows ?? seedMilestoneRows(), [rows]);
  const [sortKey, setSortKey] = useState<MilestoneSortKey>("createdAt");
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

  const toggleSort = (key: MilestoneSortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
    setPage(0);
  };
  const arrow = (key: MilestoneSortKey) => (key === sortKey ? (direction === "asc" ? " ↑" : " ↓") : "");

  return (
    <section className="milestone-board" aria-label={title}>
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

export default MilestoneBoard;
