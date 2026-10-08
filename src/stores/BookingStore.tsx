import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface BookingEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface BookingStoreValue {
  entities: BookingEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<BookingEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: BookingEntity[];
}

const BookingContext = createContext<BookingStoreValue | null>(null);
const CAPACITY = 21;

export function BookingProvider({ children, initial = [] }: { children: ReactNode; initial?: BookingEntity[] }) {
  const [entities, setEntities] = useState<BookingEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<BookingEntity, "updatedAt">) => {
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

  const value = useMemo<BookingStoreValue>(
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

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookingStore(): BookingStoreValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookingStore must be used inside BookingProvider");
  return ctx;
}

function BookingStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useBookingStore();
  const add = () => {
    const id = `booking-${entities.length + 1}`;
    upsert({ id, name: `Booking ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} bookings, {favorites.length} favorite</p>
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
export function BookingStoreDemo() {
  return (
    <section className="booking-store">
      <h2>Booking Store</h2>
      <BookingProvider>
        <BookingStoreList />
      </BookingProvider>
    </section>
  );
}
export default BookingStoreDemo;
