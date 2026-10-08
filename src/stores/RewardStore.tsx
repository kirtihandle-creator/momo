import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RewardEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RewardStoreValue {
  entities: RewardEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RewardEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RewardEntity[];
}

const RewardContext = createContext<RewardStoreValue | null>(null);
const CAPACITY = 19;

export function RewardProvider({ children, initial = [] }: { children: ReactNode; initial?: RewardEntity[] }) {
  const [entities, setEntities] = useState<RewardEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RewardEntity, "updatedAt">) => {
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

  const value = useMemo<RewardStoreValue>(
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

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
}

export function useRewardStore(): RewardStoreValue {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error("useRewardStore must be used inside RewardProvider");
  return ctx;
}

function RewardStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRewardStore();
  const add = () => {
    const id = `reward-${entities.length + 1}`;
    upsert({ id, name: `Reward ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} rewards, {favorites.length} favorite</p>
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
export function RewardStoreDemo() {
  return (
    <section className="reward-store">
      <h2>Reward Store</h2>
      <RewardProvider>
        <RewardStoreList />
      </RewardProvider>
    </section>
  );
}
export default RewardStoreDemo;
