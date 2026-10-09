import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AlbumEntity {
  id: string;
  name: string;
void;
  upsert: (entity: Omit<AlbumEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AlbumEntity[];
}

const AlbumContext = createContext<AlbumStoreValue | null>(null);
const CAPACITY = 10;

export function AlbumProvider({ children, initial = [] }: { children: ReactNode; initial?: AlbumEntity[] }) {
  const [entities, setEntities] = useState<AlbumEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AlbumEntity, "updatedAt">) => {
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

  const value = useMemo<AlbumStoreValue>(
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

  return <AlbumContext.Provider value={value}>{children}</AlbumContext.Provider>;
}

export function useAlbumStore(): AlbumStoreValue {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error("useAlbumStore must be used inside AlbumProvider");
  return ctx;
}

function AlbumStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAlbumStore();
  const add = () => {
    const id = `album-${entities.length + 1}`;
    upsert({ id, name: `Album ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} albums, {favorites.length} favorite</p>
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
export function AlbumStoreDemo() {
  return (
    <section className="album-store">
      <h2>Album Store</h2>
      <AlbumProvider>
        <AlbumStoreList />
      </AlbumProvider>
    </section>
  );
}
export default AlbumStoreDemo;
