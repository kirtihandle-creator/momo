import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CampaignEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CampaignStoreValue {
  entities: CampaignEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CampaignEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CampaignEntity[];
}

const CampaignContext = createContext<CampaignStoreValue | null>(null);
const CAPACITY = 23;

export function CampaignProvider({ children, initial = [] }: { children: ReactNode; initial?: CampaignEntity[] }) {
  const [entities, setEntities] = useState<CampaignEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CampaignEntity, "updatedAt">) => {
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

  const value = useMemo<CampaignStoreValue>(
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

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaignStore(): CampaignStoreValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaignStore must be used inside CampaignProvider");
  return ctx;
}

function CampaignStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCampaignStore();
  const add = () => {
    const id = `campaign-${entities.length + 1}`;
    upsert({ id, name: `Campaign ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} campaigns, {favorites.length} favorite</p>
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
export function CampaignStoreDemo() {
  return (
    <section className="campaign-store">
      <h2>Campaign Store</h2>
      <CampaignProvider>
        <CampaignStoreList />
      </CampaignProvider>
    </section>
  );
}
export default CampaignStoreDemo;
