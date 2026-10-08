import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface DriverEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface DriverStoreValue {
  entities: DriverEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<DriverEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: DriverEntity[];
}

const DriverContext = createContext<DriverStoreValue | null>(null);
const CAPACITY = 22;

export function DriverProvider({ children, initial = [] }: { children: ReactNode; initial?: DriverEntity[] }) {
  const [entities, setEntities] = useState<DriverEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<DriverEntity, "updatedAt">) => {
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

  const value = useMemo<DriverStoreValue>(
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

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriverStore(): DriverStoreValue {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriverStore must be used inside DriverProvider");
  return ctx;
}

function DriverStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useDriverStore();
  const add = () => {
    const id = `driver-${entities.length + 1}`;
    upsert({ id, name: `Driver ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} drivers, {favorites.length} favorite</p>
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
export function DriverStoreDemo() {
  return (
    <section className="driver-store">
      <h2>Driver Store</h2>
      <DriverProvider>
        <DriverStoreList />
      </DriverProvider>
    </section>
  );
}
export default DriverStoreDemo;
