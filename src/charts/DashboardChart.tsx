import { useMemo, useState } from "react";

export interface DashboardPoint {
  label: string;
  value: number;
}

export type DashboardChartMode = "bar" | "line";

export interface DashboardChartProps {
  title?: string;
  data?: DashboardPoint[];
  width?: number;
  height?: number;
}

export function generateDashboardSeries(count = 14): DashboardPoint[] {
  let seed = 37;
  return Array.from({ length: count }, (_, idx) => {
    seed = (seed * 9301 + 49297) % 233280;
    return { label: `W${idx + 1}`, value: Math.round((seed / 233280) * 100) };
  });
}

const PADDING = 24;

export function DashboardChart({ title = "Dashboard Chart", data, width = 320, height = 160 }: DashboardChartProps) {
  const series = useMemo(() => data ?? generateDashboardSeries(), [data]);
  const [mode, setMode] = useState<DashboardChartMode>("bar");
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(() => Math.max(1, ...series.map((p) => p.value)), [series]);
  const innerW = width - PADDING * 2;
  const innerH = height - PADDING * 2;
  const step = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const barW = Math.max(4, (innerW / series.length) * 0.6);

  const x = (idx: number) => PADDING + idx * step;
  const y = (value: number) => PADDING + innerH - (value / max) * innerH;

  const path = useMemo(
    () => series.map((p, idx) => `${idx === 0 ? "M" : "L"}${x(idx).toFixed(1)},${y(p.value).toFixed(1)}`).join(" "),
    [series, step, max],
  );
  const average = series.reduce((s, p) => s + p.value, 0) / Math.max(1, series.length);
  const trend = series.length > 1 ? series[series.length - 1].value - series[0].value : 0;

  return (
    <figure className="dashboard-chart">
      <figcaption>
        <strong>{title}</strong> avg {average.toFixed(1)} trend {trend > 0 ? "+" : ""}{trend}
        <button type="button" onClick={() => setMode((m) => (m === "bar" ? "line" : "bar"))}>{mode}</button>
      </figcaption>
      <svg width={width} height={height} role="img" aria-label={title}>
        <line x1={PADDING} y1={y(0)} x2={width - PADDING} y2={y(0)} stroke="#999" />
        <line x1={PADDING} y1={y(average)} x2={width - PADDING} y2={y(average)} stroke="#c60" strokeDasharray="4 2" />
        {mode === "bar" &&
          series.map((p, idx) => (
            <rect
              key={p.label}
              x={x(idx) - barW / 2}
              y={y(p.value)}
              width={barW}
              height={innerH - (y(p.value) - PADDING)}
              fill={hover === idx ? "#06c" : "#39f"}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        {mode === "line" && <path d={path} fill="none" stroke="#39f" strokeWidth={2} />}
        {mode === "line" &&
          series.map((p, idx) => (
            <circle key={p.label} cx={x(idx)} cy={y(p.value)} r={hover === idx ? 5 : 3} fill="#06c" onMouseEnter={() => setHover(idx)} onMouseLeave={() => setHover(null)} />
          ))}
        {hover !== null && (
          <text x={x(hover)} y={y(series[hover].value) - 8} textAnchor="middle" fontSize={11}>
            {series[hover].label}: {series[hover].value}
          </text>
        )}
      </svg>
    </figure>
  );
}
















export default DashboardChart;
