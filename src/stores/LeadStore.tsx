import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface LeadEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface LeadStoreValue {
  entities: LeadEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<LeadEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: LeadEntity[];
}

const LeadContext = createContext<LeadStoreValue | null>(null);
const CAPACITY = 21;

export function LeadProvider({ children, initial = [] }: { children: ReactNode; initial?: LeadEntity[] }) {
  const [entities, setEntities] = useState<LeadEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<LeadEntity, "updatedAt">) => {
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

  const value = useMemo<LeadStoreValue>(
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

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}

export function useLeadStore(): LeadStoreValue {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error("useLeadStore must be used inside LeadProvider");
  return ctx;
}

function LeadStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useLeadStore();
  const add = () => {
    const id = `lead-${entities.length + 1}`;
    upsert({ id, name: `Lead ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} leads, {favorites.length} favorite</p>
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
export function LeadStoreDemo() {
  return (
    <section className="lead-store">
      <h2>Lead Store</h2>
      <LeadProvider>
        <LeadStoreList />
      </LeadProvider>
    </section>
  );
}
export default LeadStoreDemo;
