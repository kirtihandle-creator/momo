import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface QuizEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface QuizStoreValue {
  entities: QuizEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<QuizEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: QuizEntity[];
}

const QuizContext = createContext<QuizStoreValue | null>(null);
const CAPACITY = 14;

export function QuizProvider({ children, initial = [] }: { children: ReactNode; initial?: QuizEntity[] }) {
  const [entities, setEntities] = useState<QuizEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<QuizEntity, "updatedAt">) => {
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

  const value = useMemo<QuizStoreValue>(
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

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuizStore(): QuizStoreValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuizStore must be used inside QuizProvider");
  return ctx;
}

function QuizStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useQuizStore();
  const add = () => {
    const id = `quiz-${entities.length + 1}`;
    upsert({ id, name: `Quiz ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} quizs, {favorites.length} favorite</p>
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
export function QuizStoreDemo() {
  return (
    <section className="quiz-store">
      <h2>Quiz Store</h2>
      <QuizProvider>
        <QuizStoreList />
      </QuizProvider>
    </section>
  );
}
export default QuizStoreDemo;
