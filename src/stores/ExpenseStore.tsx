import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ExpenseEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ExpenseStoreValue {
  entities: ExpenseEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ExpenseEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ExpenseEntity[];
}

const ExpenseContext = createContext<ExpenseStoreValue | null>(null);
const CAPACITY = 10;

export function ExpenseProvider({ children, initial = [] }: { children: ReactNode; initial?: ExpenseEntity[] }) {
  const [entities, setEntities] = useState<ExpenseEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ExpenseEntity, "updatedAt">) => {
    setEntities((prev) => {
      const exists = prev.some((e) => e.id === entity.id);
      const stamped = { ...entity, updatedAt: Date.now() };
      if (exists) return prev.map((e) => (e.id === entity.id ? stamped : e));
      if (prev.length >= CAPACITY) return prev;
      return [...prev, stamped];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, favorite: !e.favorite, updatedAt: Date.now() } : e)));
  }, []);

  const value = useMemo<ExpenseStoreValue>(
    () => ({
      entities,
      selectedId,
      select: setSelectedId,
      upsert,
      remove,
      toggleFavorite,
      favorites: entities.filter((e) => e.favorite),
    }),
    [entities, selectedId, upsert, remove, toggleFavorite],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenseStore(): ExpenseStoreValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenseStore must be used inside ExpenseProvider");
  return ctx;
}

function ExpenseStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useExpenseStore();
  const add = () => {
    const id = `expense-${entities.length + 1}`;
    upsert({ id, name: `Expense ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} expenses, {favorites.length} favorite</p>
      <button type="button" onClick={add} disabled={entities.length >= CAPACITY}>Add</button>
      <ul>
        {entities.map((e) => (
          <li key={e.id} style={{ fontWeight: e.id === selectedId ? 700 : 400 }} onClick={() => select(e.id)}>
            {e.favorite ? "* " : "- "}{e.name}
            <button type="button" onClick={(ev) => { ev.stopPropagation(); toggleFavorite(e.id); }}>fav</button>
            <button type="button" onClick={(ev) => { ev.stopPropagation(); remove(e.id); }}>x</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function ExpenseStoreDemo() {
  return (
    <section className="expense-store">
      <h2>Expense Store</h2>
      <ExpenseProvider>
        <ExpenseStoreList />
      </ExpenseProvider>
    </section>
  );
}
export default ExpenseStoreDemo;
