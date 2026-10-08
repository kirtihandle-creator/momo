import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ClinicEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ClinicStoreValue {
  entities: ClinicEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ClinicEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ClinicEntity[];
}

const ClinicContext = createContext<ClinicStoreValue | null>(null);
const CAPACITY = 11;

export function ClinicProvider({ children, initial = [] }: { children: ReactNode; initial?: ClinicEntity[] }) {
  const [entities, setEntities] = useState<ClinicEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ClinicEntity, "updatedAt">) => {
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

  const value = useMemo<ClinicStoreValue>(
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

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinicStore(): ClinicStoreValue {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinicStore must be used inside ClinicProvider");
  return ctx;
}

function ClinicStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useClinicStore();
  const add = () => {
    const id = `clinic-${entities.length + 1}`;
    upsert({ id, name: `Clinic ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} clinics, {favorites.length} favorite</p>
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
export function ClinicStoreDemo() {
  return (
    <section className="clinic-store">
      <h2>Clinic Store</h2>
      <ClinicProvider>
        <ClinicStoreList />
      </ClinicProvider>
    </section>
  );
}
export default ClinicStoreDemo;
