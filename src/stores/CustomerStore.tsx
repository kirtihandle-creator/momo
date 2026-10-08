import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CustomerEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CustomerStoreValue {
  entities: CustomerEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CustomerEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CustomerEntity[];
}

const CustomerContext = createContext<CustomerStoreValue | null>(null);
const CAPACITY = 12;

export function CustomerProvider({ children, initial = [] }: { children: ReactNode; initial?: CustomerEntity[] }) {
  const [entities, setEntities] = useState<CustomerEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CustomerEntity, "updatedAt">) => {
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

  const value = useMemo<CustomerStoreValue>(
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

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomerStore(): CustomerStoreValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomerStore must be used inside CustomerProvider");
  return ctx;
}

function CustomerStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCustomerStore();
  const add = () => {
    const id = `customer-${entities.length + 1}`;
    upsert({ id, name: `Customer ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} customers, {favorites.length} favorite</p>
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
export function CustomerStoreDemo() {
  return (
    <section className="customer-store">
      <h2>Customer Store</h2>
      <CustomerProvider>
        <CustomerStoreList />
      </CustomerProvider>
    </section>
  );
}
export default CustomerStoreDemo;
