import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RefundEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RefundStoreValue {
  entities: RefundEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RefundEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RefundEntity[];
}

const RefundContext = createContext<RefundStoreValue | null>(null);
const CAPACITY = 23;

export function RefundProvider({ children, initial = [] }: { children: ReactNode; initial?: RefundEntity[] }) {
  const [entities, setEntities] = useState<RefundEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RefundEntity, "updatedAt">) => {
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

  const value = useMemo<RefundStoreValue>(
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

  return <RefundContext.Provider value={value}>{children}</RefundContext.Provider>;
}

export function useRefundStore(): RefundStoreValue {
  const ctx = useContext(RefundContext);
  if (!ctx) throw new Error("useRefundStore must be used inside RefundProvider");
  return ctx;
}

function RefundStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRefundStore();
  const add = () => {
    const id = `refund-${entities.length + 1}`;
    upsert({ id, name: `Refund ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} refunds, {favorites.length} favorite</p>
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
export function RefundStoreDemo() {
  return (
    <section className="refund-store">
      <h2>Refund Store</h2>
      <RefundProvider>
        <RefundStoreList />
      </RefundProvider>
    </section>
  );
}
export default RefundStoreDemo;
