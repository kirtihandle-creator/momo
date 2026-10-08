import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SessionEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface SessionStoreValue {
  entities: SessionEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<SessionEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: SessionEntity[];
}

const SessionContext = createContext<SessionStoreValue | null>(null);
const CAPACITY = 16;

export function SessionProvider({ children, initial = [] }: { children: ReactNode; initial?: SessionEntity[] }) {
  const [entities, setEntities] = useState<SessionEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<SessionEntity, "updatedAt">) => {
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

  const value = useMemo<SessionStoreValue>(
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

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionStore(): SessionStoreValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionStore must be used inside SessionProvider");
  return ctx;
}

function SessionStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useSessionStore();
  const add = () => {
    const id = `session-${entities.length + 1}`;
    upsert({ id, name: `Session ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} sessions, {favorites.length} favorite</p>
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
export function SessionStoreDemo() {
  return (
    <section className="session-store">
      <h2>Session Store</h2>
      <SessionProvider>
        <SessionStoreList />
      </SessionProvider>
    </section>
  );
}
export default SessionStoreDemo;
