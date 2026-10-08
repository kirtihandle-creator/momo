import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface LogEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface LogStoreValue {
  entities: LogEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<LogEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: LogEntity[];
}

const LogContext = createContext<LogStoreValue | null>(null);
const CAPACITY = 11;

export function LogProvider({ children, initial = [] }: { children: ReactNode; initial?: LogEntity[] }) {
  const [entities, setEntities] = useState<LogEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<LogEntity, "updatedAt">) => {
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

  const value = useMemo<LogStoreValue>(
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

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function useLogStore(): LogStoreValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLogStore must be used inside LogProvider");
  return ctx;
}

function LogStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useLogStore();
  const add = () => {
    const id = `log-${entities.length + 1}`;
    upsert({ id, name: `Log ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} logs, {favorites.length} favorite</p>
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
export function LogStoreDemo() {
  return (
    <section className="log-store">
      <h2>Log Store</h2>
      <LogProvider>
        <LogStoreList />
      </LogProvider>
    </section>
  );
}
export default LogStoreDemo;
