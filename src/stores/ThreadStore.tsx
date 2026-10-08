import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ThreadEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ThreadStoreValue {
  entities: ThreadEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ThreadEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ThreadEntity[];
}

const ThreadContext = createContext<ThreadStoreValue | null>(null);
const CAPACITY = 19;

export function ThreadProvider({ children, initial = [] }: { children: ReactNode; initial?: ThreadEntity[] }) {
  const [entities, setEntities] = useState<ThreadEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ThreadEntity, "updatedAt">) => {
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

  const value = useMemo<ThreadStoreValue>(
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

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

export function useThreadStore(): ThreadStoreValue {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error("useThreadStore must be used inside ThreadProvider");
  return ctx;
}

function ThreadStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useThreadStore();
  const add = () => {
    const id = `thread-${entities.length + 1}`;
    upsert({ id, name: `Thread ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} threads, {favorites.length} favorite</p>
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
export function ThreadStoreDemo() {
  return (
    <section className="thread-store">
      <h2>Thread Store</h2>
      <ThreadProvider>
        <ThreadStoreList />
      </ThreadProvider>
    </section>
  );
}
export default ThreadStoreDemo;
