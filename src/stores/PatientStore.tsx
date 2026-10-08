import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface PatientEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface PatientStoreValue {
  entities: PatientEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<PatientEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: PatientEntity[];
}

const PatientContext = createContext<PatientStoreValue | null>(null);
const CAPACITY = 23;

export function PatientProvider({ children, initial = [] }: { children: ReactNode; initial?: PatientEntity[] }) {
  const [entities, setEntities] = useState<PatientEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<PatientEntity, "updatedAt">) => {
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

  const value = useMemo<PatientStoreValue>(
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

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatientStore(): PatientStoreValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatientStore must be used inside PatientProvider");
  return ctx;
}

function PatientStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = usePatientStore();
  const add = () => {
    const id = `patient-${entities.length + 1}`;
    upsert({ id, name: `Patient ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} patients, {favorites.length} favorite</p>
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
export function PatientStoreDemo() {
  return (
    <section className="patient-store">
      <h2>Patient Store</h2>
      <PatientProvider>
        <PatientStoreList />
      </PatientProvider>
    </section>
  );
}
export default PatientStoreDemo;
