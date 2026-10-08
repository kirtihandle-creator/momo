import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface VehicleEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface VehicleStoreValue {
  entities: VehicleEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<VehicleEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: VehicleEntity[];
}

const VehicleContext = createContext<VehicleStoreValue | null>(null);
const CAPACITY = 19;

export function VehicleProvider({ children, initial = [] }: { children: ReactNode; initial?: VehicleEntity[] }) {
  const [entities, setEntities] = useState<VehicleEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<VehicleEntity, "updatedAt">) => {
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

  const value = useMemo<VehicleStoreValue>(
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

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicleStore(): VehicleStoreValue {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicleStore must be used inside VehicleProvider");
  return ctx;
}

function VehicleStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useVehicleStore();
  const add = () => {
    const id = `vehicle-${entities.length + 1}`;
    upsert({ id, name: `Vehicle ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} vehicles, {favorites.length} favorite</p>
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
export function VehicleStoreDemo() {
  return (
    <section className="vehicle-store">
      <h2>Vehicle Store</h2>
      <VehicleProvider>
        <VehicleStoreList />
      </VehicleProvider>
    </section>
  );
}
export default VehicleStoreDemo;
