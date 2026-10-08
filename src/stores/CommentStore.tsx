import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CommentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CommentStoreValue {
  entities: CommentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CommentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CommentEntity[];
}

const CommentContext = createContext<CommentStoreValue | null>(null);
const CAPACITY = 20;

export function CommentProvider({ children, initial = [] }: { children: ReactNode; initial?: CommentEntity[] }) {
  const [entities, setEntities] = useState<CommentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CommentEntity, "updatedAt">) => {
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

  const value = useMemo<CommentStoreValue>(
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

  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}

export function useCommentStore(): CommentStoreValue {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error("useCommentStore must be used inside CommentProvider");
  return ctx;
}

function CommentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCommentStore();
  const add = () => {
    const id = `comment-${entities.length + 1}`;
    upsert({ id, name: `Comment ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} comments, {favorites.length} favorite</p>
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
export function CommentStoreDemo() {
  return (
    <section className="comment-store">
      <h2>Comment Store</h2>
      <CommentProvider>
        <CommentStoreList />
      </CommentProvider>
    </section>
  );
}
export default CommentStoreDemo;
