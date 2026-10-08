import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CourseEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CourseStoreValue {
  entities: CourseEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CourseEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CourseEntity[];
}

const CourseContext = createContext<CourseStoreValue | null>(null);
const CAPACITY = 16;

export function CourseProvider({ children, initial = [] }: { children: ReactNode; initial?: CourseEntity[] }) {
  const [entities, setEntities] = useState<CourseEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CourseEntity, "updatedAt">) => {
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

  const value = useMemo<CourseStoreValue>(
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

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourseStore(): CourseStoreValue {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourseStore must be used inside CourseProvider");
  return ctx;
}

function CourseStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCourseStore();
  const add = () => {
    const id = `course-${entities.length + 1}`;
    upsert({ id, name: `Course ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} courses, {favorites.length} favorite</p>
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
export function CourseStoreDemo() {
  return (
    <section className="course-store">
      <h2>Course Store</h2>
      <CourseProvider>
        <CourseStoreList />
      </CourseProvider>
    </section>
  );
}
export default CourseStoreDemo;
