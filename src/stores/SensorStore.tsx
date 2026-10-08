import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SensorEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface SensorStoreValue {
  entities: SensorEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<SensorEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: SensorEntity[];
}

const SensorContext = createContext<SensorStoreValue | null>(null);
const CAPACITY = 16;

export function SensorProvider({ children, initial = [] }: { children: ReactNode; initial?: SensorEntity[] }) {
  const [entities, setEntities] = useState<SensorEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<SensorEntity, "updatedAt">) => {
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

  const value = useMemo<SensorStoreValue>(
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

  return <SensorContext.Provider value={value}>{children}</SensorContext.Provider>;
}

export function useSensorStore(): SensorStoreValue {
  const ctx = useContext(SensorContext);
  if (!ctx) throw new Error("useSensorStore must be used inside SensorProvider");
  return ctx;
}

function SensorStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useSensorStore();
  const add = () => {
    const id = `sensor-${entities.length + 1}`;
    upsert({ id, name: `Sensor ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} sensors, {favorites.length} favorite</p>
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
export function SensorStoreDemo() {
  return (
    <section className="sensor-store">
      <h2>Sensor Store</h2>
      <SensorProvider>
        <SensorStoreList />
      </SensorProvider>
    </section>
  );
}
export default SensorStoreDemo;
