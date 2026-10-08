import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PlaylistEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PlaylistStoreValue {
  entities: PlaylistEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PlaylistEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PlaylistEntity[];
}

const PlaylistContext = createContext<PlaylistStoreValue | null>(null);
const CAPACITY = 23;

export function PlaylistProvider({ children, initial = [] }: { children: ReactNode; initial?: PlaylistEntity[] }) {
  const [entities, setEntities] = useState<PlaylistEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PlaylistEntity, "updatedAt">) => {
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

  const value = useMemo<PlaylistStoreValue>(
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

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylistStore(): PlaylistStoreValue {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error("usePlaylistStore must be used inside PlaylistProvider");
  return ctx;
}

function PlaylistStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePlaylistStore();
  const add = () => {
    const id = `playlist-${entities.length + 1}`;
    upsert({ id, name: `Playlist ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} playlists, {favorites.length} favorite</p>
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
export function PlaylistStoreDemo() {
  return (
    <section className="playlist-store">
      <h2>Playlist Store</h2>
      <PlaylistProvider>
        <PlaylistStoreList />
      </PlaylistProvider>
    </section>
  );
}
export default PlaylistStoreDemo;
