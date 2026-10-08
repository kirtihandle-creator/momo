import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ReadingEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ReadingStoreValue {
  entities: ReadingEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ReadingEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ReadingEntity[];
}

const ReadingContext = createContext<ReadingStoreValue | null>(null);
const CAPACITY = 17;

export function ReadingProvider({ children, initial = [] }: { children: ReactNode; initial?: ReadingEntity[] }) {
  const [entities, setEntities] = useState<ReadingEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ReadingEntity, "updatedAt">) => {
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

  const value = useMemo<ReadingStoreValue>(
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

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReadingStore(): ReadingStoreValue {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error("useReadingStore must be used inside ReadingProvider");
  return ctx;
}

function ReadingStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useReadingStore();
  const add = () => {
    const id = `reading-${entities.length + 1}`;
    upsert({ id, name: `Reading ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} readings, {favorites.length} favorite</p>
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
export function ReadingStoreDemo() {
  return (
    <section className="reading-store">
      <h2>Reading Store</h2>
      <ReadingProvider>
        <ReadingStoreList />
      </ReadingProvider>
    </section>
  );
}
export default ReadingStoreDemo;
