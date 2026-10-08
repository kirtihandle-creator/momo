import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface IssueEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface IssueStoreValue {
  entities: IssueEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<IssueEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: IssueEntity[];
}

const IssueContext = createContext<IssueStoreValue | null>(null);
const CAPACITY = 16;

export function IssueProvider({ children, initial = [] }: { children: ReactNode; initial?: IssueEntity[] }) {
  const [entities, setEntities] = useState<IssueEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<IssueEntity, "updatedAt">) => {
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

  const value = useMemo<IssueStoreValue>(
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

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}

export function useIssueStore(): IssueStoreValue {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error("useIssueStore must be used inside IssueProvider");
  return ctx;
}

function IssueStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useIssueStore();
  const add = () => {
    const id = `issue-${entities.length + 1}`;
    upsert({ id, name: `Issue ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} issues, {favorites.length} favorite</p>
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
export function IssueStoreDemo() {
  return (
    <section className="issue-store">
      <h2>Issue Store</h2>
      <IssueProvider>
        <IssueStoreList />
      </IssueProvider>
    </section>
  );
}
export default IssueStoreDemo;
