import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface LessonEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface LessonStoreValue {
  entities: LessonEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<LessonEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: LessonEntity[];
}

const LessonContext = createContext<LessonStoreValue | null>(null);
const CAPACITY = 15;

export function LessonProvider({ children, initial = [] }: { children: ReactNode; initial?: LessonEntity[] }) {
  const [entities, setEntities] = useState<LessonEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<LessonEntity, "updatedAt">) => {
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

  const value = useMemo<LessonStoreValue>(
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

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLessonStore(): LessonStoreValue {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useLessonStore must be used inside LessonProvider");
  return ctx;
}

function LessonStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useLessonStore();
  const add = () => {
    const id = `lesson-${entities.length + 1}`;
    upsert({ id, name: `Lesson ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} lessons, {favorites.length} favorite</p>
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
export function LessonStoreDemo() {
  return (
    <section className="lesson-store">
      <h2>Lesson Store</h2>
      <LessonProvider>
        <LessonStoreList />
      </LessonProvider>
    </section>
  );
}
export default LessonStoreDemo;
