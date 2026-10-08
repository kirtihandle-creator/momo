import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ImageEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ImageStoreValue {
  entities: ImageEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ImageEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ImageEntity[];
}

const ImageContext = createContext<ImageStoreValue | null>(null);
const CAPACITY = 21;

export function ImageProvider({ children, initial = [] }: { children: ReactNode; initial?: ImageEntity[] }) {
  const [entities, setEntities] = useState<ImageEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ImageEntity, "updatedAt">) => {
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

  const value = useMemo<ImageStoreValue>(
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

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
}

export function useImageStore(): ImageStoreValue {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error("useImageStore must be used inside ImageProvider");
  return ctx;
}

function ImageStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useImageStore();
  const add = () => {
    const id = `image-${entities.length + 1}`;
    upsert({ id, name: `Image ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} images, {favorites.length} favorite</p>
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
export function ImageStoreDemo() {
  return (
    <section className="image-store">
      <h2>Image Store</h2>
      <ImageProvider>
        <ImageStoreList />
      </ImageProvider>
    </section>
  );
}
export default ImageStoreDemo;
