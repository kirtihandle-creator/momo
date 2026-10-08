import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface DashboardEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface DashboardStoreValue {
  entities: DashboardEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<DashboardEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: DashboardEntity[];
}

const DashboardContext = createContext<DashboardStoreValue | null>(null);
const CAPACITY = 15;

export function DashboardProvider({ children, initial = [] }: { children: ReactNode; initial?: DashboardEntity[] }) {
  const [entities, setEntities] = useState<DashboardEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<DashboardEntity, "updatedAt">) => {
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

  const value = useMemo<DashboardStoreValue>(
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

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardStore(): DashboardStoreValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardStore must be used inside DashboardProvider");
  return ctx;
}

function DashboardStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useDashboardStore();
  const add = () => {
    const id = `dashboard-${entities.length + 1}`;
    upsert({ id, name: `Dashboard ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} dashboards, {favorites.length} favorite</p>
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
export function DashboardStoreDemo() {
  return (
    <section className="dashboard-store">
      <h2>Dashboard Store</h2>
      <DashboardProvider>
        <DashboardStoreList />
      </DashboardProvider>
    </section>
  );
}
export default DashboardStoreDemo;
