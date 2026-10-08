import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface InventoryEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface InventoryStoreValue {
  entities: InventoryEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<InventoryEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: InventoryEntity[];
}

const InventoryContext = createContext<InventoryStoreValue | null>(null);
const CAPACITY = 12;

export function InventoryProvider({ children, initial = [] }: { children: ReactNode; initial?: InventoryEntity[] }) {
  const [entities, setEntities] = useState<InventoryEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<InventoryEntity, "updatedAt">) => {
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

  const value = useMemo<InventoryStoreValue>(
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

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventoryStore(): InventoryStoreValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventoryStore must be used inside InventoryProvider");
  return ctx;
}

function InventoryStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useInventoryStore();
  const add = () => {
    const id = `inventory-${entities.length + 1}`;
    upsert({ id, name: `Inventory ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} inventorys, {favorites.length} favorite</p>
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
export function InventoryStoreDemo() {
  return (
    <section className="inventory-store">
      <h2>Inventory Store</h2>
      <InventoryProvider>
        <InventoryStoreList />
      </InventoryProvider>
    </section>
  );
}
export default InventoryStoreDemo;
