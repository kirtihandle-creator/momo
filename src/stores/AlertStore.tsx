import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AlertEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AlertStoreValue {
  entities: AlertEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AlertEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AlertEntity[];
}

const AlertContext = createContext<AlertStoreValue | null>(null);
const CAPACITY = 12;

export function AlertProvider({ children, initial = [] }: { children: ReactNode; initial?: AlertEntity[] }) {
  const [entities, setEntities] = useState<AlertEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AlertEntity, "updatedAt">) => {
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

  const value = useMemo<AlertStoreValue>(
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

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlertStore(): AlertStoreValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlertStore must be used inside AlertProvider");
  return ctx;
}

function AlertStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAlertStore();
  const add = () => {
    const id = `alert-${entities.length + 1}`;
    upsert({ id, name: `Alert ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} alerts, {favorites.length} favorite</p>
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
export function AlertStoreDemo() {
  return (
    <section className="alert-store">
      <h2>Alert Store</h2>
      <AlertProvider>
        <AlertStoreList />
      </AlertProvider>
    </section>
  );
}
export default AlertStoreDemo;
