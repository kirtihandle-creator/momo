import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface EpisodeEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface EpisodeStoreValue {
  entities: EpisodeEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<EpisodeEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: EpisodeEntity[];
}

const EpisodeContext = createContext<EpisodeStoreValue | null>(null);
const CAPACITY = 13;

export function EpisodeProvider({ children, initial = [] }: { children: ReactNode; initial?: EpisodeEntity[] }) {
  const [entities, setEntities] = useState<EpisodeEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<EpisodeEntity, "updatedAt">) => {
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

  const value = useMemo<EpisodeStoreValue>(
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

  return <EpisodeContext.Provider value={value}>{children}</EpisodeContext.Provider>;
}

export function useEpisodeStore(): EpisodeStoreValue {
  const ctx = useContext(EpisodeContext);
  if (!ctx) throw new Error("useEpisodeStore must be used inside EpisodeProvider");
  return ctx;
}

function EpisodeStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useEpisodeStore();
  const add = () => {
    const id = `episode-${entities.length + 1}`;
    upsert({ id, name: `Episode ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} episodes, {favorites.length} favorite</p>
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
export function EpisodeStoreDemo() {
  return (
    <section className="episode-store">
      <h2>Episode Store</h2>
      <EpisodeProvider>
        <EpisodeStoreList />
      </EpisodeProvider>
    </section>
  );
}
export default EpisodeStoreDemo;
