import { useMemo, useState } from "react";

export type PrescriptionPeriod = "7d" | "30d" | "90d";

export interface PrescriptionSnapshot {
  day: number;
  count: number;
  revenue: number;
  errors: number;
}

export interface PrescriptionStat {
  key: string;
  label: string;
  current: number;
  previous: number;
  format: (n: number) => string;
}

const PERIOD_DAYS: Record<PrescriptionPeriod, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function buildPrescriptionHistory(days = 180): PrescriptionSnapshot[] {
  return Array.from({ length: days }, (_, day) => {
    const wave = Math.sin(day / 5) * 20;
    const count = Math.max(0, Math.round(730 + wave + (day % 7) * 3));
    return { day, count, revenue: count * 12, errors: (day * 91) % 9 };
  });
}

function sum(rows: PrescriptionSnapshot[], key: keyof Omit<PrescriptionSnapshot, "day">): number {
  return rows.reduce((total, r) => total + r[key], 0);
}

export function computePrescriptionStats(history: PrescriptionSnapshot[], period: PrescriptionPeriod): PrescriptionStat[] {
  const n = PERIOD_DAYS[period];
  const current = history.slice(-n);
  const previous = history.slice(-2 * n, -n);
  const money = (v: number) => `$${v.toLocaleString()}`;
  const plain = (v: number) => v.toLocaleString();
  const rate = (v: number) => `${v.toFixed(2)}%`;
  const errRate = (rows: PrescriptionSnapshot[]) => (sum(rows, "count") ? (sum(rows, "errors") / sum(rows, "count")) * 100 : 0);
  return [
    { key: "count", label: "Prescriptions", current: sum(current, "count"), previous: sum(previous, "count"), format: plain },
    { key: "revenue", label: "Revenue", current: sum(current, "revenue"), previous: sum(previous, "revenue"), format: money },
    { key: "errors", label: "Error rate", current: errRate(current), previous: errRate(previous), format: rate },
  ];
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const d = values.map((v, idx) => `${idx === 0 ? "M" : "L"}${(idx / Math.max(1, values.length - 1)) * 100},${30 - ((v - min) / span) * 30}`).join(" ");
  return (
    <svg width={100} height={30} aria-hidden="true">
      <path d={d} fill="none" stroke="#39f" strokeWidth={1.5} />
    </svg>
  );
}

export function PrescriptionStats({ history }: { history?: PrescriptionSnapshot[] }) {
  const data = useMemo(() => history ?? buildPrescriptionHistory(), [history]);
  const [period, setPeriod] = useState<PrescriptionPeriod>("30d");
  const tiles = useMemo(() => computePrescriptionStats(data, period), [data, period]);
  const recent = useMemo(() => data.slice(-PERIOD_DAYS[period]).map((r) => r.count), [data, period]);

  return (
    <section className="prescription-stats">
      <h2>Prescription Stats</h2>
      <nav>
        {(Object.keys(PERIOD_DAYS) as PrescriptionPeriod[]).map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} disabled={p === period}>{p}</button>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 12 }}>
        {tiles.map((t) => {
          const delta = t.previous ? ((t.current - t.previous) / t.previous) * 100 : 0;
          const good = t.key === "errors" ? delta <= 0 : delta >= 0;
          return (
            <article key={t.key} style={{ border: "1px solid #ddd", padding: 8, minWidth: 120 }}>
              <small>{t.label}</small>
              <strong style={{ display: "block" }}>{t.format(t.current)}</strong>
              <span style={{ color: good ? "green" : "crimson" }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs prior {period}</span>
            </article>
          );
        })}
      </div>
      <Sparkline values={recent} />
    </section>
  );
}








export default PrescriptionStats;
