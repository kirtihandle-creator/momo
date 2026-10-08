import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PrescriptionEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PrescriptionStoreValue {
  entities: PrescriptionEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PrescriptionEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PrescriptionEntity[];
}

const PrescriptionContext = createContext<PrescriptionStoreValue | null>(null);
const CAPACITY = 10;

export function PrescriptionProvider({ children, initial = [] }: { children: ReactNode; initial?: PrescriptionEntity[] }) {
  const [entities, setEntities] = useState<PrescriptionEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PrescriptionEntity, "updatedAt">) => {
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

  const value = useMemo<PrescriptionStoreValue>(
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

  return <PrescriptionContext.Provider value={value}>{children}</PrescriptionContext.Provider>;
}

export function usePrescriptionStore(): PrescriptionStoreValue {
  const ctx = useContext(PrescriptionContext);
  if (!ctx) throw new Error("usePrescriptionStore must be used inside PrescriptionProvider");
  return ctx;
}

function PrescriptionStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePrescriptionStore();
  const add = () => {
    const id = `prescription-${entities.length + 1}`;
    upsert({ id, name: `Prescription ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} prescriptions, {favorites.length} favorite</p>
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
export function PrescriptionStoreDemo() {
  return (
    <section className="prescription-store">
      <h2>Prescription Store</h2>
      <PrescriptionProvider>
        <PrescriptionStoreList />
      </PrescriptionProvider>
    </section>
  );
}
export default PrescriptionStoreDemo;
