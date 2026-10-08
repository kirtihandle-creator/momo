import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface DocumentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface DocumentStoreValue {
  entities: DocumentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<DocumentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: DocumentEntity[];
}

const DocumentContext = createContext<DocumentStoreValue | null>(null);
const CAPACITY = 18;

export function DocumentProvider({ children, initial = [] }: { children: ReactNode; initial?: DocumentEntity[] }) {
  const [entities, setEntities] = useState<DocumentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<DocumentEntity, "updatedAt">) => {
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

  const value = useMemo<DocumentStoreValue>(
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

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocumentStore(): DocumentStoreValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocumentStore must be used inside DocumentProvider");
  return ctx;
}

function DocumentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useDocumentStore();
  const add = () => {
    const id = `document-${entities.length + 1}`;
    upsert({ id, name: `Document ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} documents, {favorites.length} favorite</p>
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
export function DocumentStoreDemo() {
  return (
    <section className="document-store">
      <h2>Document Store</h2>
      <DocumentProvider>
        <DocumentStoreList />
      </DocumentProvider>
    </section>
  );
}
export default DocumentStoreDemo;
