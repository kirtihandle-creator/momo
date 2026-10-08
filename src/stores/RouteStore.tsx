import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RouteEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RouteStoreValue {
  entities: RouteEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RouteEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RouteEntity[];
}

const RouteContext = createContext<RouteStoreValue | null>(null);
const CAPACITY = 20;

export function RouteProvider({ children, initial = [] }: { children: ReactNode; initial?: RouteEntity[] }) {
  const [entities, setEntities] = useState<RouteEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RouteEntity, "updatedAt">) => {
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

  const value = useMemo<RouteStoreValue>(
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

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRouteStore(): RouteStoreValue {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRouteStore must be used inside RouteProvider");
  return ctx;
}

function RouteStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRouteStore();
  const add = () => {
    const id = `route-${entities.length + 1}`;
    upsert({ id, name: `Route ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} routes, {favorites.length} favorite</p>
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
export function RouteStoreDemo() {
  return (
    <section className="route-store">
      <h2>Route Store</h2>
      <RouteProvider>
        <RouteStoreList />
      </RouteProvider>
    </section>
  );
}
export default RouteStoreDemo;
