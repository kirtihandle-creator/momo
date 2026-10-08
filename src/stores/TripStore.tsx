import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TripEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TripStoreValue {
  entities: TripEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TripEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TripEntity[];
}

const TripContext = createContext<TripStoreValue | null>(null);
const CAPACITY = 24;

export function TripProvider({ children, initial = [] }: { children: ReactNode; initial?: TripEntity[] }) {
  const [entities, setEntities] = useState<TripEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TripEntity, "updatedAt">) => {
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

  const value = useMemo<TripStoreValue>(
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

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripStore(): TripStoreValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripStore must be used inside TripProvider");
  return ctx;
}

function TripStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTripStore();
  const add = () => {
    const id = `trip-${entities.length + 1}`;
    upsert({ id, name: `Trip ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} trips, {favorites.length} favorite</p>
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
export function TripStoreDemo() {
  return (
    <section className="trip-store">
      <h2>Trip Store</h2>
      <TripProvider>
        <TripStoreList />
      </TripProvider>
    </section>
  );
}
export default TripStoreDemo;
