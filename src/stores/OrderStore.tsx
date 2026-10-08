import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface OrderEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface OrderStoreValue {
  entities: OrderEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<OrderEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: OrderEntity[];
}

const OrderContext = createContext<OrderStoreValue | null>(null);
const CAPACITY = 10;

export function OrderProvider({ children, initial = [] }: { children: ReactNode; initial?: OrderEntity[] }) {
  const [entities, setEntities] = useState<OrderEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<OrderEntity, "updatedAt">) => {
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

  const value = useMemo<OrderStoreValue>(
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

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderStore(): OrderStoreValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrderStore must be used inside OrderProvider");
  return ctx;
}

function OrderStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useOrderStore();
  const add = () => {
    const id = `order-${entities.length + 1}`;
    upsert({ id, name: `Order ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} orders, {favorites.length} favorite</p>
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
export function OrderStoreDemo() {
  return (
    <section className="order-store">
      <h2>Order Store</h2>
      <OrderProvider>
        <OrderStoreList />
      </OrderProvider>
    </section>
  );
}
export default OrderStoreDemo;
