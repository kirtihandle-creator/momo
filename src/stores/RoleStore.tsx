import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RoleEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RoleStoreValue {
  entities: RoleEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RoleEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RoleEntity[];
}

const RoleContext = createContext<RoleStoreValue | null>(null);
const CAPACITY = 22;

export function RoleProvider({ children, initial = [] }: { children: ReactNode; initial?: RoleEntity[] }) {
  const [entities, setEntities] = useState<RoleEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RoleEntity, "updatedAt">) => {
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

  const value = useMemo<RoleStoreValue>(
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

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleStore(): RoleStoreValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoleStore must be used inside RoleProvider");
  return ctx;
}

function RoleStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRoleStore();
  const add = () => {
    const id = `role-${entities.length + 1}`;
    upsert({ id, name: `Role ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} roles, {favorites.length} favorite</p>
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
export function RoleStoreDemo() {
  return (
    <section className="role-store">
      <h2>Role Store</h2>
      <RoleProvider>
        <RoleStoreList />
      </RoleProvider>
    </section>
  );
}
export default RoleStoreDemo;
