import { useCallback, useMemo, useReducer } from "react";
export type WarehouseStatus = "new" | "review" | "closed";

export interface WarehouseItem {
  id: number;
  title: string;
  status: WarehouseStatus;
  score: number;
}
export interface WarehouseFormProps {
  heading?: string;
  initialItems?: WarehouseItem[];
  onSelect?: (item: WarehouseItem) => void;
}
type Action =
  | { type: "add"; item: WarehouseItem }
  | { type: "remove"; id: number }
  | { type: "cycle"; id: number }
  | { type: "filter"; status: WarehouseStatus | "all" };
interface State {
  items: WarehouseItem[];
  filter: WarehouseStatus | "all";
  nextId: number;
}
const ORDER: WarehouseStatus[] = ["new", "review", "closed"];
const LIMIT = 7;

function nextStatus(current: WarehouseStatus): WarehouseStatus {
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

export function WarehouseForm({ heading = "Warehouse Form", initialItems = [], onSelect }: WarehouseFormProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    filter: "all",
    nextId: initialItems.length + 1,
  });

  const visible = useMemo(
    () => state.items.filter((it) => state.filter === "all" || it.status === state.filter),
    [state.items, state.filter],
  );
  const warehouseCount = visible.length;
  const averageScore = useMemo(
    () => (visible.length ? visible.reduce((sum, it) => sum + it.score, 0) / visible.length : 0),
    [visible],
  );

  const handleAdd = useCallback(() => {
    const id = state.nextId;
    dispatch({ type: "add", item: { id, title: `Warehouse #${id}`, status: "new", score: (id * 10) % 100 } });
  }, [state.nextId]);

  return (
    <section className="warehouse-form" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>
          {warehouseCount} shown, average score {averageScore.toFixed(1)}
        </p>
        <select value={state.filter} onChange={(e) => dispatch({ type: "filter", status: e.target.value as WarehouseStatus | "all" })}>
          <option value="all">all</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={handleAdd} disabled={state.items.length >= LIMIT}>Add warehouse</button>
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

export default WarehouseForm;
