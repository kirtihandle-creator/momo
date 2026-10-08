import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface FolderEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface FolderStoreValue {
  entities: FolderEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<FolderEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: FolderEntity[];
}

const FolderContext = createContext<FolderStoreValue | null>(null);
const CAPACITY = 19;

export function FolderProvider({ children, initial = [] }: { children: ReactNode; initial?: FolderEntity[] }) {
  const [entities, setEntities] = useState<FolderEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<FolderEntity, "updatedAt">) => {
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

  const value = useMemo<FolderStoreValue>(
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

  return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
}

export function useFolderStore(): FolderStoreValue {
  const ctx = useContext(FolderContext);
  if (!ctx) throw new Error("useFolderStore must be used inside FolderProvider");
  return ctx;
}

function FolderStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useFolderStore();
  const add = () => {
    const id = `folder-${entities.length + 1}`;
    upsert({ id, name: `Folder ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} folders, {favorites.length} favorite</p>
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
export function FolderStoreDemo() {
  return (
    <section className="folder-store">
      <h2>Folder Store</h2>
      <FolderProvider>
        <FolderStoreList />
      </FolderProvider>
    </section>
  );
}
export default FolderStoreDemo;
