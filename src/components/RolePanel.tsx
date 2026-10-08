import { useCallback, useMemo, useReducer } from "react";
export type RoleStatus = "open" | "inProgress" | "done";

export interface RoleItem {
  id: number;
  title: string;
  status: RoleStatus;
  score: number;
}
export interface RolePanelProps {
  heading?: string;
  initialItems?: RoleItem[];
  onSelect?: (item: RoleItem) => void;
}
type Action =
  | { type: "add"; item: RoleItem }
  | { type: "remove"; id: number }
  | { type: "cycle"; id: number }
  | { type: "filter"; status: RoleStatus | "all" };
interface State {
  items: RoleItem[];
  filter: RoleStatus | "all";
  nextId: number;
}
const ORDER: RoleStatus[] = ["open", "inProgress", "done"];
const LIMIT = 5;

function nextStatus(current: RoleStatus): RoleStatus {
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

export function RolePanel({ heading = "Role Panel", initialItems = [], onSelect }: RolePanelProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    filter: "all",
    nextId: initialItems.length + 1,
  });

  const visible = useMemo(
    () => state.items.filter((it) => state.filter === "all" || it.status === state.filter),
    [state.items, state.filter],
  );
  const roleCount = visible.length;
  const averageScore = useMemo(
    () => (visible.length ? visible.reduce((sum, it) => sum + it.score, 0) / visible.length : 0),
    [visible],
  );

  const handleAdd = useCallback(() => {
    const id = state.nextId;
    dispatch({ type: "add", item: { id, title: `Role #${id}`, status: "open", score: (id * 9) % 100 } });
  }, [state.nextId]);

  return (
    <section className="role-panel" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>
          {roleCount} shown, average score {averageScore.toFixed(1)}
        </p>
        <select value={state.filter} onChange={(e) => dispatch({ type: "filter", status: e.target.value as RoleStatus | "all" })}>
          <option value="all">all</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={handleAdd} disabled={state.items.length >= LIMIT}>Add role</button>
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

export default RolePanel;
