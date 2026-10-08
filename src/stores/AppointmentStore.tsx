import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AppointmentEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AppointmentStoreValue {
  entities: AppointmentEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AppointmentEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AppointmentEntity[];
}

const AppointmentContext = createContext<AppointmentStoreValue | null>(null);
const CAPACITY = 24;

export function AppointmentProvider({ children, initial = [] }: { children: ReactNode; initial?: AppointmentEntity[] }) {
  const [entities, setEntities] = useState<AppointmentEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AppointmentEntity, "updatedAt">) => {
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

  const value = useMemo<AppointmentStoreValue>(
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

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointmentStore(): AppointmentStoreValue {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error("useAppointmentStore must be used inside AppointmentProvider");
  return ctx;
}

function AppointmentStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAppointmentStore();
  const add = () => {
    const id = `appointment-${entities.length + 1}`;
    upsert({ id, name: `Appointment ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} appointments, {favorites.length} favorite</p>
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
export function AppointmentStoreDemo() {
  return (
    <section className="appointment-store">
      <h2>Appointment Store</h2>
      <AppointmentProvider>
        <AppointmentStoreList />
      </AppointmentProvider>
    </section>
  );
}
export default AppointmentStoreDemo;
