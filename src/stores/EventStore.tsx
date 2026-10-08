import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface EventEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface EventStoreValue {
  entities: EventEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<EventEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: EventEntity[];
}

const EventContext = createContext<EventStoreValue | null>(null);
const CAPACITY = 12;

export function EventProvider({ children, initial = [] }: { children: ReactNode; initial?: EventEntity[] }) {
  const [entities, setEntities] = useState<EventEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<EventEntity, "updatedAt">) => {
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

  const value = useMemo<EventStoreValue>(
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

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventStore(): EventStoreValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventStore must be used inside EventProvider");
  return ctx;
}

function EventStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useEventStore();
  const add = () => {
    const id = `event-${entities.length + 1}`;
    upsert({ id, name: `Event ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} events, {favorites.length} favorite</p>
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
export function EventStoreDemo() {
  return (
    <section className="event-store">
      <h2>Event Store</h2>
      <EventProvider>
        <EventStoreList />
      </EventProvider>
    </section>
  );
}
export default EventStoreDemo;
