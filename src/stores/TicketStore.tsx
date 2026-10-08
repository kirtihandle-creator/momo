import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TicketEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TicketStoreValue {
  entities: TicketEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TicketEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TicketEntity[];
}

const TicketContext = createContext<TicketStoreValue | null>(null);
const CAPACITY = 15;

export function TicketProvider({ children, initial = [] }: { children: ReactNode; initial?: TicketEntity[] }) {
  const [entities, setEntities] = useState<TicketEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TicketEntity, "updatedAt">) => {
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

  const value = useMemo<TicketStoreValue>(
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

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTicketStore(): TicketStoreValue {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTicketStore must be used inside TicketProvider");
  return ctx;
}

function TicketStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTicketStore();
  const add = () => {
    const id = `ticket-${entities.length + 1}`;
    upsert({ id, name: `Ticket ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} tickets, {favorites.length} favorite</p>
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
export function TicketStoreDemo() {
  return (
    <section className="ticket-store">
      <h2>Ticket Store</h2>
      <TicketProvider>
        <TicketStoreList />
      </TicketProvider>
    </section>
  );
}
export default TicketStoreDemo;
