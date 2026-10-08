import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ReleaseEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ReleaseStoreValue {
  entities: ReleaseEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ReleaseEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ReleaseEntity[];
}

const ReleaseContext = createContext<ReleaseStoreValue | null>(null);
const CAPACITY = 17;

export function ReleaseProvider({ children, initial = [] }: { children: ReactNode; initial?: ReleaseEntity[] }) {
  const [entities, setEntities] = useState<ReleaseEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ReleaseEntity, "updatedAt">) => {
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

  const value = useMemo<ReleaseStoreValue>(
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

  return <ReleaseContext.Provider value={value}>{children}</ReleaseContext.Provider>;
}

export function useReleaseStore(): ReleaseStoreValue {
  const ctx = useContext(ReleaseContext);
  if (!ctx) throw new Error("useReleaseStore must be used inside ReleaseProvider");
  return ctx;
}

function ReleaseStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useReleaseStore();
  const add = () => {
    const id = `release-${entities.length + 1}`;
    upsert({ id, name: `Release ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} releases, {favorites.length} favorite</p>
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
export function ReleaseStoreDemo() {
  return (
    <section className="release-store">
      <h2>Release Store</h2>
      <ReleaseProvider>
        <ReleaseStoreList />
      </ReleaseProvider>
    </section>
  );
}
export default ReleaseStoreDemo;
