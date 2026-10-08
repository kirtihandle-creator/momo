import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PaymentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PaymentStoreValue {
  entities: PaymentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PaymentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PaymentEntity[];
}

const PaymentContext = createContext<PaymentStoreValue | null>(null);
const CAPACITY = 22;

export function PaymentProvider({ children, initial = [] }: { children: ReactNode; initial?: PaymentEntity[] }) {
  const [entities, setEntities] = useState<PaymentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PaymentEntity, "updatedAt">) => {
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

  const value = useMemo<PaymentStoreValue>(
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

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePaymentStore(): PaymentStoreValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePaymentStore must be used inside PaymentProvider");
  return ctx;
}

function PaymentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePaymentStore();
  const add = () => {
    const id = `payment-${entities.length + 1}`;
    upsert({ id, name: `Payment ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} payments, {favorites.length} favorite</p>
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
export function PaymentStoreDemo() {
  return (
    <section className="payment-store">
      <h2>Payment Store</h2>
      <PaymentProvider>
        <PaymentStoreList />
      </PaymentProvider>
    </section>
  );
}
export default PaymentStoreDemo;
