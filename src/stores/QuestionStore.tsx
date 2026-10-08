import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface QuestionEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface QuestionStoreValue {
  entities: QuestionEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<QuestionEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: QuestionEntity[];
}

const QuestionContext = createContext<QuestionStoreValue | null>(null);
const CAPACITY = 12;

export function QuestionProvider({ children, initial = [] }: { children: ReactNode; initial?: QuestionEntity[] }) {
  const [entities, setEntities] = useState<QuestionEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<QuestionEntity, "updatedAt">) => {
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

  const value = useMemo<QuestionStoreValue>(
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

  return <QuestionContext.Provider value={value}>{children}</QuestionContext.Provider>;
}

export function useQuestionStore(): QuestionStoreValue {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error("useQuestionStore must be used inside QuestionProvider");
  return ctx;
}

function QuestionStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useQuestionStore();
  const add = () => {
    const id = `question-${entities.length + 1}`;
    upsert({ id, name: `Question ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} questions, {favorites.length} favorite</p>
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
export function QuestionStoreDemo() {
  return (
    <section className="question-store">
      <h2>Question Store</h2>
      <QuestionProvider>
        <QuestionStoreList />
      </QuestionProvider>
    </section>
  );
}
export default QuestionStoreDemo;
