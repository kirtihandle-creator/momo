import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PolicyEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PolicyStoreValue {
  entities: PolicyEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PolicyEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PolicyEntity[];
}

const PolicyContext = createContext<PolicyStoreValue | null>(null);
const CAPACITY = 24;

export function PolicyProvider({ children, initial = [] }: { children: ReactNode; initial?: PolicyEntity[] }) {
  const [entities, setEntities] = useState<PolicyEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PolicyEntity, "updatedAt">) => {
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

  const value = useMemo<PolicyStoreValue>(
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

  return <PolicyContext.Provider value={value}>{children}</PolicyContext.Provider>;
}

export function usePolicyStore(): PolicyStoreValue {
  const ctx = useContext(PolicyContext);
  if (!ctx) throw new Error("usePolicyStore must be used inside PolicyProvider");
  return ctx;
}

function PolicyStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePolicyStore();
  const add = () => {
    const id = `policy-${entities.length + 1}`;
    upsert({ id, name: `Policy ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} policys, {favorites.length} favorite</p>
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
export function PolicyStoreDemo() {
  return (
    <section className="policy-store">
      <h2>Policy Store</h2>
      <PolicyProvider>
        <PolicyStoreList />
      </PolicyProvider>
    </section>
  );
}
export default PolicyStoreDemo;
