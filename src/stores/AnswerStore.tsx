import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AnswerEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AnswerStoreValue {
  entities: AnswerEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AnswerEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AnswerEntity[];
}

const AnswerContext = createContext<AnswerStoreValue | null>(null);
const CAPACITY = 13;

export function AnswerProvider({ children, initial = [] }: { children: ReactNode; initial?: AnswerEntity[] }) {
  const [entities, setEntities] = useState<AnswerEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AnswerEntity, "updatedAt">) => {
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

  const value = useMemo<AnswerStoreValue>(
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

  return <AnswerContext.Provider value={value}>{children}</AnswerContext.Provider>;
}

export function useAnswerStore(): AnswerStoreValue {
  const ctx = useContext(AnswerContext);
  if (!ctx) throw new Error("useAnswerStore must be used inside AnswerProvider");
  return ctx;
}

function AnswerStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAnswerStore();
  const add = () => {
    const id = `answer-${entities.length + 1}`;
    upsert({ id, name: `Answer ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} answers, {favorites.length} favorite</p>
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
export function AnswerStoreDemo() {
  return (
    <section className="answer-store">
      <h2>Answer Store</h2>
      <AnswerProvider>
        <AnswerStoreList />
      </AnswerProvider>
    </section>
  );
}
export default AnswerStoreDemo;
