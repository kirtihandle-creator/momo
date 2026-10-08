import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface WarehouseEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface WarehouseStoreValue {
  entities: WarehouseEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<WarehouseEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: WarehouseEntity[];
}

const WarehouseContext = createContext<WarehouseStoreValue | null>(null);
const CAPACITY = 13;

export function WarehouseProvider({ children, initial = [] }: { children: ReactNode; initial?: WarehouseEntity[] }) {
  const [entities, setEntities] = useState<WarehouseEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<WarehouseEntity, "updatedAt">) => {
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

  const value = useMemo<WarehouseStoreValue>(
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

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouseStore(): WarehouseStoreValue {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouseStore must be used inside WarehouseProvider");
  return ctx;
}

function WarehouseStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useWarehouseStore();
  const add = () => {
    const id = `warehouse-${entities.length + 1}`;
    upsert({ id, name: `Warehouse ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} warehouses, {favorites.length} favorite</p>
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
export function WarehouseStoreDemo() {
  return (
    <section className="warehouse-store">
      <h2>Warehouse Store</h2>
      <WarehouseProvider>
        <WarehouseStoreList />
      </WarehouseProvider>
    </section>
  );
}
export default WarehouseStoreDemo;
