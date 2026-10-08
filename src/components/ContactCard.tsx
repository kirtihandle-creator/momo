import { useCallback, useMemo, useReducer } from "react";
export type ContactStatus = "draft" | "active" | "archived";

export interface ContactItem {
  id: number;
  title: string;
  status: ContactStatus;
  score: number;
}
export interface ContactCardProps {
  heading?: string;
  initialItems?: ContactItem[];
  onSelect?: (item: ContactItem) => void;
}
type Action =
  | { type: "add"; item: ContactItem }
  | { type: "remove"; id: number }
  | { type: "cycle"; id: number }
  | { type: "filter"; status: ContactStatus | "all" };
interface State {
  items: ContactItem[];
  filter: ContactStatus | "all";
  nextId: number;
}
const ORDER: ContactStatus[] = ["draft", "active", "archived"];
const LIMIT = 9;

function nextStatus(current: ContactStatus): ContactStatus {
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

export function ContactCard({ heading = "Contact Card", initialItems = [], onSelect }: ContactCardProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    filter: "all",
    nextId: initialItems.length + 1,
  });

  const visible = useMemo(
    () => state.items.filter((it) => state.filter === "all" || it.status === state.filter),
    [state.items, state.filter],
  );
  const contactCount = visible.length;
  const averageScore = useMemo(
    () => (visible.length ? visible.reduce((sum, it) => sum + it.score, 0) / visible.length : 0),
    [visible],
  );

  const handleAdd = useCallback(() => {
    const id = state.nextId;
    dispatch({ type: "add", item: { id, title: `Contact #${id}`, status: "draft", score: (id * 7) % 100 } });
  }, [state.nextId]);

  return (
    <section className="contact-card" aria-label={heading}>
      <header>
        <h2>{heading}</h2>
        <p>
          {contactCount} shown, average score {averageScore.toFixed(1)}
        </p>
        <select value={state.filter} onChange={(e) => dispatch({ type: "filter", status: e.target.value as ContactStatus | "all" })}>
          <option value="all">all</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={handleAdd} disabled={state.items.length >= LIMIT}>Add contact</button>
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

export default ContactCard;
