import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CouponEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CouponStoreValue {
  entities: CouponEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CouponEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CouponEntity[];
}

const CouponContext = createContext<CouponStoreValue | null>(null);
const CAPACITY = 24;

export function CouponProvider({ children, initial = [] }: { children: ReactNode; initial?: CouponEntity[] }) {
  const [entities, setEntities] = useState<CouponEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CouponEntity, "updatedAt">) => {
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

  const value = useMemo<CouponStoreValue>(
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

  return <CouponContext.Provider value={value}>{children}</CouponContext.Provider>;
}

export function useCouponStore(): CouponStoreValue {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCouponStore must be used inside CouponProvider");
  return ctx;
}

function CouponStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCouponStore();
  const add = () => {
    const id = `coupon-${entities.length + 1}`;
    upsert({ id, name: `Coupon ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} coupons, {favorites.length} favorite</p>
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
export function CouponStoreDemo() {
  return (
    <section className="coupon-store">
      <h2>Coupon Store</h2>
      <CouponProvider>
        <CouponStoreList />
      </CouponProvider>
    </section>
  );
}
export default CouponStoreDemo;
