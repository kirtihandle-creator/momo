import { useCallback, useMemo, useReducer } from "react";
export type PrescriptionStatus = "draft" | "active" | "archived";

export interface PrescriptionItem {
  id: number;
  title: string;
  status: PrescriptionStatus;
  score: number;
}
export interface PrescriptionCardProps {
  heading?: string;
  initialItems?: PrescriptionItem[];
  onSelect?: (item: PrescriptionItem) => void;
}
type Action =
  | { type: "add"; item: PrescriptionItem }
  | { type: "remove"; id: number }
  | { type: "cycle"; id: number }
  | { type: "filter"; status: PrescriptionStatus | "all" };
interface State {
  items: PrescriptionItem[];
  filter: PrescriptionStatus | "all";
  nextId: number;
}
const ORDER: PrescriptionStatus[] = ["draft", "active", "archived"];
const LIMIT = 11;

function nextStatus(current: PrescriptionStatus): PrescriptionStatus {
  const index = ORDER.indexOf(current);
  return ORDER[(index + 1) % ORDER.length];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      if (state.items.length >= LIMIT) return state;
      return { ...state, items: [...state.items, action.item], nextId: state.nextId + 1 };
    case "remove":
      return { ...state, items: state.items.filter((it) => it.id !== action.id) };
    case "cycle":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, status: nextStatus(it.status) } : it,
        ),
      };
    case "filter":
      return { ...state, filter: action.status };
  }
}

export function PrescriptionCard({ heading = "Prescription Card", initialItems = [], onSelect }: PrescriptionCardProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    filter: "all",
    nextId: initialItems.length + 1,
  });

  const visible = useMemo(
    () => state.items.filter((it) => state.filter === "all" || it.status === state.filter),
    [state.items, state.filter],
  );
  const prescriptionCount = visible.length;
  const averageScore = useMemo(
    () => (visible.length ? visible.reduce((sum, it) => sum + it.score, 0) / visible.length : 0),
    [visible],
  );

  const handleAdd = useCallback(() => {
    const id = state.nextId;
    dispatch({ type: "add", item: { id, title: `Prescription #${id}`, status: "draft", score: (id * 7) % 100 } });
  }, [state.nextId]);

  return (
    <section className="prescription-card" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>
          {prescriptionCount} shown, average score {averageScore.toFixed(1)}
        </p>
        <select value={state.filter} onChange={(e) => dispatch({ type: "filter", status: e.target.value as PrescriptionStatus | "all" })}>
          <option value="all">all</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={handleAdd} disabled={state.items.length >= LIMIT}>Add prescription</button>
      </header>
      <ul>
        {visible.map((it) => (
          <li key={it.id} onClick={() => onSelect?.(it)}>
            <span>{it.title}</span> <em>{it.status}</em> <strong>{it.score}</strong>
            <button type="button" onClick={(e) => { e.stopPropagation(); dispatch({ type: "cycle", id: it.id }); }}>next</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); dispatch({ type: "remove", id: it.id }); }}>remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PrescriptionCard;
