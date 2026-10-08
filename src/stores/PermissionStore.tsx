import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PermissionEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PermissionStoreValue {
  entities: PermissionEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PermissionEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PermissionEntity[];
}

const PermissionContext = createContext<PermissionStoreValue | null>(null);
const CAPACITY = 23;

export function PermissionProvider({ children, initial = [] }: { children: ReactNode; initial?: PermissionEntity[] }) {
  const [entities, setEntities] = useState<PermissionEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PermissionEntity, "updatedAt">) => {
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

  const value = useMemo<PermissionStoreValue>(
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

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissionStore(): PermissionStoreValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissionStore must be used inside PermissionProvider");
  return ctx;
}

function PermissionStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePermissionStore();
  const add = () => {
    const id = `permission-${entities.length + 1}`;
    upsert({ id, name: `Permission ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} permissions, {favorites.length} favorite</p>
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
export function PermissionStoreDemo() {
  return (
    <section className="permission-store">
      <h2>Permission Store</h2>
      <PermissionProvider>
        <PermissionStoreList />
      </PermissionProvider>
    </section>
  );
}
export default PermissionStoreDemo;
