import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MilestoneEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface MilestoneStoreValue {
  entities: MilestoneEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<MilestoneEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: MilestoneEntity[];
}

const MilestoneContext = createContext<MilestoneStoreValue | null>(null);
const CAPACITY = 19;

export function MilestoneProvider({ children, initial = [] }: { children: ReactNode; initial?: MilestoneEntity[] }) {
  const [entities, setEntities] = useState<MilestoneEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<MilestoneEntity, "updatedAt">) => {
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

  const value = useMemo<MilestoneStoreValue>(
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

  return <MilestoneContext.Provider value={value}>{children}</MilestoneContext.Provider>;
}

export function useMilestoneStore(): MilestoneStoreValue {
  const ctx = useContext(MilestoneContext);
  if (!ctx) throw new Error("useMilestoneStore must be used inside MilestoneProvider");
  return ctx;
}

function MilestoneStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useMilestoneStore();
  const add = () => {
    const id = `milestone-${entities.length + 1}`;
    upsert({ id, name: `Milestone ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} milestones, {favorites.length} favorite</p>
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
export function MilestoneStoreDemo() {
  return (
    <section className="milestone-store">
      <h2>Milestone Store</h2>
      <MilestoneProvider>
        <MilestoneStoreList />
      </MilestoneProvider>
    </section>
  );
}
export default MilestoneStoreDemo;
