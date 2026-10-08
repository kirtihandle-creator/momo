import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ArtistEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ArtistStoreValue {
  entities: ArtistEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ArtistEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ArtistEntity[];
}

const ArtistContext = createContext<ArtistStoreValue | null>(null);
const CAPACITY = 11;

export function ArtistProvider({ children, initial = [] }: { children: ReactNode; initial?: ArtistEntity[] }) {
  const [entities, setEntities] = useState<ArtistEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ArtistEntity, "updatedAt">) => {
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

  const value = useMemo<ArtistStoreValue>(
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

  return <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>;
}

export function useArtistStore(): ArtistStoreValue {
  const ctx = useContext(ArtistContext);
  if (!ctx) throw new Error("useArtistStore must be used inside ArtistProvider");
  return ctx;
}

function ArtistStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useArtistStore();
  const add = () => {
    const id = `artist-${entities.length + 1}`;
    upsert({ id, name: `Artist ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} artists, {favorites.length} favorite</p>
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
export function ArtistStoreDemo() {
  return (
    <section className="artist-store">
      <h2>Artist Store</h2>
      <ArtistProvider>
        <ArtistStoreList />
      </ArtistProvider>
    </section>
  );
}
export default ArtistStoreDemo;
