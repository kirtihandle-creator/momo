import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ShipmentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ShipmentStoreValue {
  entities: ShipmentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ShipmentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ShipmentEntity[];
}

const ShipmentContext = createContext<ShipmentStoreValue | null>(null);
const CAPACITY = 14;

export function ShipmentProvider({ children, initial = [] }: { children: ReactNode; initial?: ShipmentEntity[] }) {
  const [entities, setEntities] = useState<ShipmentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ShipmentEntity, "updatedAt">) => {
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

  const value = useMemo<ShipmentStoreValue>(
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

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}

export function useShipmentStore(): ShipmentStoreValue {
  const ctx = useContext(ShipmentContext);
  if (!ctx) throw new Error("useShipmentStore must be used inside ShipmentProvider");
  return ctx;
}

function ShipmentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useShipmentStore();
  const add = () => {
    const id = `shipment-${entities.length + 1}`;
    upsert({ id, name: `Shipment ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} shipments, {favorites.length} favorite</p>
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
export function ShipmentStoreDemo() {
  return (
    <section className="shipment-store">
      <h2>Shipment Store</h2>
      <ShipmentProvider>
        <ShipmentStoreList />
      </ShipmentProvider>
    </section>
  );
}
export default ShipmentStoreDemo;
