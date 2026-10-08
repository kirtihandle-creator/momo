import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface FileEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface FileStoreValue {
  entities: FileEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<FileEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: FileEntity[];
}

const FileContext = createContext<FileStoreValue | null>(null);
const CAPACITY = 20;

export function FileProvider({ children, initial = [] }: { children: ReactNode; initial?: FileEntity[] }) {
  const [entities, setEntities] = useState<FileEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<FileEntity, "updatedAt">) => {
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

  const value = useMemo<FileStoreValue>(
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

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFileStore(): FileStoreValue {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFileStore must be used inside FileProvider");
  return ctx;
}

function FileStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useFileStore();
  const add = () => {
    const id = `file-${entities.length + 1}`;
    upsert({ id, name: `File ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} files, {favorites.length} favorite</p>
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
export function FileStoreDemo() {
  return (
    <section className="file-store">
      <h2>File Store</h2>
      <FileProvider>
        <FileStoreList />
      </FileProvider>
    </section>
  );
}
export default FileStoreDemo;
