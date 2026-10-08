import { useCallback, useMemo, useReducer } from "react";
export type HotelStatus = "new" | "review" | "closed";

export interface HotelItem {
  id: number;
  title: string;
  status: HotelStatus;
  score: number;
}
export interface HotelFormProps {
  heading?: string;
  initialItems?: HotelItem[];
  onSelect?: (item: HotelItem) => void;
}
type Action =
  | { type: "add"; item: HotelItem }
  | { type: "remove"; id: number }
  | { type: "cycle"; id: number }
  | { type: "filter"; status: HotelStatus | "all" };
interface State {
  items: HotelItem[];
  filter: HotelStatus | "all";
  nextId: number;
}
const ORDER: HotelStatus[] = ["new", "review", "closed"];
const LIMIT = 8;

function nextStatus(current: HotelStatus): HotelStatus {
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

export function HotelForm({ heading = "Hotel Form", initialItems = [], onSelect }: HotelFormProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    filter: "all",
    nextId: initialItems.length + 1,
  });

  const visible = useMemo(
    () => state.items.filter((it) => state.filter === "all" || it.status === state.filter),
    [state.items, state.filter],
  );
  const hotelCount = visible.length;
  const averageScore = useMemo(
    () => (visible.length ? visible.reduce((sum, it) => sum + it.score, 0) / visible.length : 0),
    [visible],
  );

  const handleAdd = useCallback(() => {
    const id = state.nextId;
    dispatch({ type: "add", item: { id, title: `Hotel #${id}`, status: "new", score: (id * 10) % 100 } });
  }, [state.nextId]);

  return (
    <section className="hotel-form" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>
          {hotelCount} shown, average score {averageScore.toFixed(1)}
        </p>
        <select value={state.filter} onChange={(e) => dispatch({ type: "filter", status: e.target.value as HotelStatus | "all" })}>
          <option value="all">all</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={handleAdd} disabled={state.items.length >= LIMIT}>Add hotel</button>
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

export default HotelForm;
