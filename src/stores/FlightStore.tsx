import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface FlightEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface FlightStoreValue {
  entities: FlightEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<FlightEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: FlightEntity[];
}

const FlightContext = createContext<FlightStoreValue | null>(null);
const CAPACITY = 22;

export function FlightProvider({ children, initial = [] }: { children: ReactNode; initial?: FlightEntity[] }) {
  const [entities, setEntities] = useState<FlightEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<FlightEntity, "updatedAt">) => {
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

  const value = useMemo<FlightStoreValue>(
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

  return <FlightContext.Provider value={value}>{children}</FlightContext.Provider>;
}

export function useFlightStore(): FlightStoreValue {
  const ctx = useContext(FlightContext);
  if (!ctx) throw new Error("useFlightStore must be used inside FlightProvider");
  return ctx;
}

function FlightStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useFlightStore();
  const add = () => {
    const id = `flight-${entities.length + 1}`;
    upsert({ id, name: `Flight ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} flights, {favorites.length} favorite</p>
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
export function FlightStoreDemo() {
  return (
    <section className="flight-store">
      <h2>Flight Store</h2>
      <FlightProvider>
        <FlightStoreList />
      </FlightProvider>
    </section>
  );
}
export default FlightStoreDemo;
