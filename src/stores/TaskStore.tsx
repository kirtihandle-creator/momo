import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TaskEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TaskStoreValue {
  entities: TaskEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TaskEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TaskEntity[];
}

const TaskContext = createContext<TaskStoreValue | null>(null);
const CAPACITY = 19;

export function TaskProvider({ children, initial = [] }: { children: ReactNode; initial?: TaskEntity[] }) {
  const [entities, setEntities] = useState<TaskEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TaskEntity, "updatedAt">) => {
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

  const value = useMemo<TaskStoreValue>(
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

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskStore(): TaskStoreValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskStore must be used inside TaskProvider");
  return ctx;
}

function TaskStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTaskStore();
  const add = () => {
    const id = `task-${entities.length + 1}`;
    upsert({ id, name: `Task ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} tasks, {favorites.length} favorite</p>
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
export function TaskStoreDemo() {
  return (
    <section className="task-store">
      <h2>Task Store</h2>
      <TaskProvider>
        <TaskStoreList />
      </TaskProvider>
    </section>
  );
}
export default TaskStoreDemo;
