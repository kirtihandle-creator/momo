import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface DealEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface DealStoreValue {
  entities: DealEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<DealEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: DealEntity[];
}

const DealContext = createContext<DealStoreValue | null>(null);
const CAPACITY = 22;

export function DealProvider({ children, initial = [] }: { children: ReactNode; initial?: DealEntity[] }) {
  const [entities, setEntities] = useState<DealEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<DealEntity, "updatedAt">) => {
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

  const value = useMemo<DealStoreValue>(
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

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

export function useDealStore(): DealStoreValue {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error("useDealStore must be used inside DealProvider");
  return ctx;
}

function DealStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useDealStore();
  const add = () => {
    const id = `deal-${entities.length + 1}`;
    upsert({ id, name: `Deal ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} deals, {favorites.length} favorite</p>
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
export function DealStoreDemo() {
  return (
    <section className="deal-store">
      <h2>Deal Store</h2>
      <DealProvider>
        <DealStoreList />
      </DealProvider>
    </section>
  );
}
export default DealStoreDemo;
