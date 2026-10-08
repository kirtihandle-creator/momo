import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface HotelEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface HotelStoreValue {
  entities: HotelEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<HotelEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: HotelEntity[];
}

const HotelContext = createContext<HotelStoreValue | null>(null);
const CAPACITY = 23;

export function HotelProvider({ children, initial = [] }: { children: ReactNode; initial?: HotelEntity[] }) {
  const [entities, setEntities] = useState<HotelEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<HotelEntity, "updatedAt">) => {
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

  const value = useMemo<HotelStoreValue>(
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

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

export function useHotelStore(): HotelStoreValue {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error("useHotelStore must be used inside HotelProvider");
  return ctx;
}

function HotelStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useHotelStore();
  const add = () => {
    const id = `hotel-${entities.length + 1}`;
    upsert({ id, name: `Hotel ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} hotels, {favorites.length} favorite</p>
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
export function HotelStoreDemo() {
  return (
    <section className="hotel-store">
      <h2>Hotel Store</h2>
      <HotelProvider>
        <HotelStoreList />
      </HotelProvider>
    </section>
  );
}
export default HotelStoreDemo;
