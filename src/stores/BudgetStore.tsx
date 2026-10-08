import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface BudgetEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface BudgetStoreValue {
  entities: BudgetEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<BudgetEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: BudgetEntity[];
}

const BudgetContext = createContext<BudgetStoreValue | null>(null);
const CAPACITY = 11;

export function BudgetProvider({ children, initial = [] }: { children: ReactNode; initial?: BudgetEntity[] }) {
  const [entities, setEntities] = useState<BudgetEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<BudgetEntity, "updatedAt">) => {
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

  const value = useMemo<BudgetStoreValue>(
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

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgetStore(): BudgetStoreValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudgetStore must be used inside BudgetProvider");
  return ctx;
}

function BudgetStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useBudgetStore();
  const add = () => {
    const id = `budget-${entities.length + 1}`;
    upsert({ id, name: `Budget ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} budgets, {favorites.length} favorite</p>
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
export function BudgetStoreDemo() {
  return (
    <section className="budget-store">
      <h2>Budget Store</h2>
      <BudgetProvider>
        <BudgetStoreList />
      </BudgetProvider>
    </section>
  );
}
export default BudgetStoreDemo;
