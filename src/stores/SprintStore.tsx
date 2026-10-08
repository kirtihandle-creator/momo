import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SprintEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface SprintStoreValue {
  entities: SprintEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<SprintEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: SprintEntity[];
}

const SprintContext = createContext<SprintStoreValue | null>(null);
const CAPACITY = 18;

export function SprintProvider({ children, initial = [] }: { children: ReactNode; initial?: SprintEntity[] }) {
  const [entities, setEntities] = useState<SprintEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<SprintEntity, "updatedAt">) => {
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

  const value = useMemo<SprintStoreValue>(
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

  return <SprintContext.Provider value={value}>{children}</SprintContext.Provider>;
}

export function useSprintStore(): SprintStoreValue {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprintStore must be used inside SprintProvider");
  return ctx;
}

function SprintStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useSprintStore();
  const add = () => {
    const id = `sprint-${entities.length + 1}`;
    upsert({ id, name: `Sprint ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} sprints, {favorites.length} favorite</p>
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
export function SprintStoreDemo() {
  return (
    <section className="sprint-store">
      <h2>Sprint Store</h2>
      <SprintProvider>
        <SprintStoreList />
      </SprintProvider>
    </section>
  );
}
export default SprintStoreDemo;
