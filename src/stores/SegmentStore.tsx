import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SegmentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface SegmentStoreValue {
  entities: SegmentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<SegmentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: SegmentEntity[];
}

const SegmentContext = createContext<SegmentStoreValue | null>(null);
const CAPACITY = 24;

export function SegmentProvider({ children, initial = [] }: { children: ReactNode; initial?: SegmentEntity[] }) {
  const [entities, setEntities] = useState<SegmentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<SegmentEntity, "updatedAt">) => {
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

  const value = useMemo<SegmentStoreValue>(
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

  return <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>;
}

export function useSegmentStore(): SegmentStoreValue {
  const ctx = useContext(SegmentContext);
  if (!ctx) throw new Error("useSegmentStore must be used inside SegmentProvider");
  return ctx;
}

function SegmentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useSegmentStore();
  const add = () => {
    const id = `segment-${entities.length + 1}`;
    upsert({ id, name: `Segment ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} segments, {favorites.length} favorite</p>
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
export function SegmentStoreDemo() {
  return (
    <section className="segment-store">
      <h2>Segment Store</h2>
      <SegmentProvider>
        <SegmentStoreList />
      </SegmentProvider>
    </section>
  );
}
export default SegmentStoreDemo;
