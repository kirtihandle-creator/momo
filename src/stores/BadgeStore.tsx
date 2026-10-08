import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface BadgeEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface BadgeStoreValue {
  entities: BadgeEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<BadgeEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: BadgeEntity[];
}

const BadgeContext = createContext<BadgeStoreValue | null>(null);
const CAPACITY = 18;

export function BadgeProvider({ children, initial = [] }: { children: ReactNode; initial?: BadgeEntity[] }) {
  const [entities, setEntities] = useState<BadgeEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<BadgeEntity, "updatedAt">) => {
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

  const value = useMemo<BadgeStoreValue>(
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

  return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}

export function useBadgeStore(): BadgeStoreValue {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadgeStore must be used inside BadgeProvider");
  return ctx;
}

function BadgeStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useBadgeStore();
  const add = () => {
    const id = `badge-${entities.length + 1}`;
    upsert({ id, name: `Badge ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} badges, {favorites.length} favorite</p>
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
export function BadgeStoreDemo() {
  return (
    <section className="badge-store">
      <h2>Badge Store</h2>
      <BadgeProvider>
        <BadgeStoreList />
      </BadgeProvider>
    </section>
  );
}
export default BadgeStoreDemo;
