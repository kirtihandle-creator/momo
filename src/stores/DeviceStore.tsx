import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface DeviceEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface DeviceStoreValue {
  entities: DeviceEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<DeviceEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: DeviceEntity[];
}

const DeviceContext = createContext<DeviceStoreValue | null>(null);
const CAPACITY = 15;

export function DeviceProvider({ children, initial = [] }: { children: ReactNode; initial?: DeviceEntity[] }) {
  const [entities, setEntities] = useState<DeviceEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<DeviceEntity, "updatedAt">) => {
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

  const value = useMemo<DeviceStoreValue>(
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

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDeviceStore(): DeviceStoreValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDeviceStore must be used inside DeviceProvider");
  return ctx;
}

function DeviceStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useDeviceStore();
  const add = () => {
    const id = `device-${entities.length + 1}`;
    upsert({ id, name: `Device ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} devices, {favorites.length} favorite</p>
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
export function DeviceStoreDemo() {
  return (
    <section className="device-store">
      <h2>Device Store</h2>
      <DeviceProvider>
        <DeviceStoreList />
      </DeviceProvider>
    </section>
  );
}
export default DeviceStoreDemo;
