import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface StopEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface StopStoreValue {
  entities: StopEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<StopEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: StopEntity[];
}

const StopContext = createContext<StopStoreValue | null>(null);
const CAPACITY = 21;

export function StopProvider({ children, initial = [] }: { children: ReactNode; initial?: StopEntity[] }) {
  const [entities, setEntities] = useState<StopEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<StopEntity, "updatedAt">) => {
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

  const value = useMemo<StopStoreValue>(
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

  return <StopContext.Provider value={value}>{children}</StopContext.Provider>;
}

export function useStopStore(): StopStoreValue {
  const ctx = useContext(StopContext);
  if (!ctx) throw new Error("useStopStore must be used inside StopProvider");
  return ctx;
}

function StopStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useStopStore();
  const add = () => {
    const id = `stop-${entities.length + 1}`;
    upsert({ id, name: `Stop ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} stops, {favorites.length} favorite</p>
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
export function StopStoreDemo() {
  return (
    <section className="stop-store">
      <h2>Stop Store</h2>
      <StopProvider>
        <StopStoreList />
      </StopProvider>
    </section>
  );
}
export default StopStoreDemo;
