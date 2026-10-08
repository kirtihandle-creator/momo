import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ScheduleEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ScheduleStoreValue {
  entities: ScheduleEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ScheduleEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ScheduleEntity[];
}

const ScheduleContext = createContext<ScheduleStoreValue | null>(null);
const CAPACITY = 13;

export function ScheduleProvider({ children, initial = [] }: { children: ReactNode; initial?: ScheduleEntity[] }) {
  const [entities, setEntities] = useState<ScheduleEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ScheduleEntity, "updatedAt">) => {
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

  const value = useMemo<ScheduleStoreValue>(
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

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useScheduleStore(): ScheduleStoreValue {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useScheduleStore must be used inside ScheduleProvider");
  return ctx;
}

function ScheduleStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useScheduleStore();
  const add = () => {
    const id = `schedule-${entities.length + 1}`;
    upsert({ id, name: `Schedule ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} schedules, {favorites.length} favorite</p>
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
export function ScheduleStoreDemo() {
  return (
    <section className="schedule-store">
      <h2>Schedule Store</h2>
      <ScheduleProvider>
        <ScheduleStoreList />
      </ScheduleProvider>
    </section>
  );
}
export default ScheduleStoreDemo;
