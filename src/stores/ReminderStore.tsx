import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ReminderEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ReminderStoreValue {
  entities: ReminderEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ReminderEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ReminderEntity[];
}

const ReminderContext = createContext<ReminderStoreValue | null>(null);
const CAPACITY = 16;

export function ReminderProvider({ children, initial = [] }: { children: ReactNode; initial?: ReminderEntity[] }) {
  const [entities, setEntities] = useState<ReminderEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ReminderEntity, "updatedAt">) => {
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

  const value = useMemo<ReminderStoreValue>(
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

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminderStore(): ReminderStoreValue {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error("useReminderStore must be used inside ReminderProvider");
  return ctx;
}

function ReminderStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useReminderStore();
  const add = () => {
    const id = `reminder-${entities.length + 1}`;
    upsert({ id, name: `Reminder ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} reminders, {favorites.length} favorite</p>
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
export function ReminderStoreDemo() {
  return (
    <section className="reminder-store">
      <h2>Reminder Store</h2>
      <ReminderProvider>
        <ReminderStoreList />
      </ReminderProvider>
    </section>
  );
}
export default ReminderStoreDemo;
