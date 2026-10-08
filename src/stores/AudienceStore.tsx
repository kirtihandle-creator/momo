import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AudienceEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AudienceStoreValue {
  entities: AudienceEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AudienceEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AudienceEntity[];
}

const AudienceContext = createContext<AudienceStoreValue | null>(null);
const CAPACITY = 10;

export function AudienceProvider({ children, initial = [] }: { children: ReactNode; initial?: AudienceEntity[] }) {
  const [entities, setEntities] = useState<AudienceEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AudienceEntity, "updatedAt">) => {
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

  const value = useMemo<AudienceStoreValue>(
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

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudienceStore(): AudienceStoreValue {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error("useAudienceStore must be used inside AudienceProvider");
  return ctx;
}

function AudienceStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAudienceStore();
  const add = () => {
    const id = `audience-${entities.length + 1}`;
    upsert({ id, name: `Audience ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} audiences, {favorites.length} favorite</p>
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
export function AudienceStoreDemo() {
  return (
    <section className="audience-store">
      <h2>Audience Store</h2>
      <AudienceProvider>
        <AudienceStoreList />
      </AudienceProvider>
    </section>
  );
}
export default AudienceStoreDemo;
