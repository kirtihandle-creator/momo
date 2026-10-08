import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MeetingEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface MeetingStoreValue {
  entities: MeetingEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<MeetingEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: MeetingEntity[];
}

const MeetingContext = createContext<MeetingStoreValue | null>(null);
const CAPACITY = 15;

export function MeetingProvider({ children, initial = [] }: { children: ReactNode; initial?: MeetingEntity[] }) {
  const [entities, setEntities] = useState<MeetingEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<MeetingEntity, "updatedAt">) => {
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

  const value = useMemo<MeetingStoreValue>(
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

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}

export function useMeetingStore(): MeetingStoreValue {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeetingStore must be used inside MeetingProvider");
  return ctx;
}

function MeetingStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useMeetingStore();
  const add = () => {
    const id = `meeting-${entities.length + 1}`;
    upsert({ id, name: `Meeting ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} meetings, {favorites.length} favorite</p>
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
export function MeetingStoreDemo() {
  return (
    <section className="meeting-store">
      <h2>Meeting Store</h2>
      <MeetingProvider>
        <MeetingStoreList />
      </MeetingProvider>
    </section>
  );
}
export default MeetingStoreDemo;
