import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TrackEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TrackStoreValue {
  entities: TrackEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TrackEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TrackEntity[];
}

const TrackContext = createContext<TrackStoreValue | null>(null);
const CAPACITY = 24;

export function TrackProvider({ children, initial = [] }: { children: ReactNode; initial?: TrackEntity[] }) {
  const [entities, setEntities] = useState<TrackEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TrackEntity, "updatedAt">) => {
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

  const value = useMemo<TrackStoreValue>(
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

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useTrackStore(): TrackStoreValue {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error("useTrackStore must be used inside TrackProvider");
  return ctx;
}

function TrackStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTrackStore();
  const add = () => {
    const id = `track-${entities.length + 1}`;
    upsert({ id, name: `Track ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} tracks, {favorites.length} favorite</p>
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
export function TrackStoreDemo() {
  return (
    <section className="track-store">
      <h2>Track Store</h2>
      <TrackProvider>
        <TrackStoreList />
      </TrackProvider>
    </section>
  );
}
export default TrackStoreDemo;
