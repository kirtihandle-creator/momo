import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AuditEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AuditStoreValue {
  entities: AuditEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AuditEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AuditEntity[];
}

const AuditContext = createContext<AuditStoreValue | null>(null);
const CAPACITY = 10;

export function AuditProvider({ children, initial = [] }: { children: ReactNode; initial?: AuditEntity[] }) {
  const [entities, setEntities] = useState<AuditEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AuditEntity, "updatedAt">) => {
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

  const value = useMemo<AuditStoreValue>(
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

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAuditStore(): AuditStoreValue {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAuditStore must be used inside AuditProvider");
  return ctx;
}

function AuditStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAuditStore();
  const add = () => {
    const id = `audit-${entities.length + 1}`;
    upsert({ id, name: `Audit ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} audits, {favorites.length} favorite</p>
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
export function AuditStoreDemo() {
  return (
    <section className="audit-store">
      <h2>Audit Store</h2>
      <AuditProvider>
        <AuditStoreList />
      </AuditProvider>
    </section>
  );
}
export default AuditStoreDemo;
