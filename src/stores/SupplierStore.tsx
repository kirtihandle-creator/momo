import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SupplierEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface SupplierStoreValue {
  entities: SupplierEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<SupplierEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: SupplierEntity[];
}

const SupplierContext = createContext<SupplierStoreValue | null>(null);
const CAPACITY = 14;

export function SupplierProvider({ children, initial = [] }: { children: ReactNode; initial?: SupplierEntity[] }) {
  const [entities, setEntities] = useState<SupplierEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<SupplierEntity, "updatedAt">) => {
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

  const value = useMemo<SupplierStoreValue>(
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

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}

export function useSupplierStore(): SupplierStoreValue {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error("useSupplierStore must be used inside SupplierProvider");
  return ctx;
}

function SupplierStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useSupplierStore();
  const add = () => {
    const id = `supplier-${entities.length + 1}`;
    upsert({ id, name: `Supplier ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} suppliers, {favorites.length} favorite</p>
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
export function SupplierStoreDemo() {
  return (
    <section className="supplier-store">
      <h2>Supplier Store</h2>
      <SupplierProvider>
        <SupplierStoreList />
      </SupplierProvider>
    </section>
  );
}
export default SupplierStoreDemo;
