import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface GuestEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface GuestStoreValue {
  entities: GuestEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<GuestEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: GuestEntity[];
}

const GuestContext = createContext<GuestStoreValue | null>(null);
const CAPACITY = 19;

export function GuestProvider({ children, initial = [] }: { children: ReactNode; initial?: GuestEntity[] }) {
  const [entities, setEntities] = useState<GuestEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<GuestEntity, "updatedAt">) => {
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

  const value = useMemo<GuestStoreValue>(
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

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuestStore(): GuestStoreValue {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuestStore must be used inside GuestProvider");
  return ctx;
}

function GuestStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useGuestStore();
  const add = () => {
    const id = `guest-${entities.length + 1}`;
    upsert({ id, name: `Guest ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} guests, {favorites.length} favorite</p>
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
export function GuestStoreDemo() {
  return (
    <section className="guest-store">
      <h2>Guest Store</h2>
      <GuestProvider>
        <GuestStoreList />
      </GuestProvider>
    </section>
  );
}
export default GuestStoreDemo;
