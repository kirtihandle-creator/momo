import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PodcastEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PodcastStoreValue {
  entities: PodcastEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PodcastEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PodcastEntity[];
}

const PodcastContext = createContext<PodcastStoreValue | null>(null);
const CAPACITY = 12;

export function PodcastProvider({ children, initial = [] }: { children: ReactNode; initial?: PodcastEntity[] }) {
  const [entities, setEntities] = useState<PodcastEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PodcastEntity, "updatedAt">) => {
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

  const value = useMemo<PodcastStoreValue>(
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

  return <PodcastContext.Provider value={value}>{children}</PodcastContext.Provider>;
}

export function usePodcastStore(): PodcastStoreValue {
  const ctx = useContext(PodcastContext);
  if (!ctx) throw new Error("usePodcastStore must be used inside PodcastProvider");
  return ctx;
}

function PodcastStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePodcastStore();
  const add = () => {
    const id = `podcast-${entities.length + 1}`;
    upsert({ id, name: `Podcast ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} podcasts, {favorites.length} favorite</p>
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
export function PodcastStoreDemo() {
  return (
    <section className="podcast-store">
      <h2>Podcast Store</h2>
      <PodcastProvider>
        <PodcastStoreList />
      </PodcastProvider>
    </section>
  );
}
export default PodcastStoreDemo;
