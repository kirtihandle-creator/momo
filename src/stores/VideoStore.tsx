import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface VideoEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface VideoStoreValue {
  entities: VideoEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<VideoEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: VideoEntity[];
}

const VideoContext = createContext<VideoStoreValue | null>(null);
const CAPACITY = 22;

export function VideoProvider({ children, initial = [] }: { children: ReactNode; initial?: VideoEntity[] }) {
  const [entities, setEntities] = useState<VideoEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<VideoEntity, "updatedAt">) => {
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

  const value = useMemo<VideoStoreValue>(
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

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
}

export function useVideoStore(): VideoStoreValue {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error("useVideoStore must be used inside VideoProvider");
  return ctx;
}

function VideoStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useVideoStore();
  const add = () => {
    const id = `video-${entities.length + 1}`;
    upsert({ id, name: `Video ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} videos, {favorites.length} favorite</p>
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
export function VideoStoreDemo() {
  return (
    <section className="video-store">
      <h2>Video Store</h2>
      <VideoProvider>
        <VideoStoreList />
      </VideoProvider>
    </section>
  );
}
export default VideoStoreDemo;
