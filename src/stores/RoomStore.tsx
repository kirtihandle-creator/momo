import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RoomEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RoomStoreValue {
  entities: RoomEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RoomEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RoomEntity[];
}

const RoomContext = createContext<RoomStoreValue | null>(null);
const CAPACITY = 20;

export function RoomProvider({ children, initial = [] }: { children: ReactNode; initial?: RoomEntity[] }) {
  const [entities, setEntities] = useState<RoomEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RoomEntity, "updatedAt">) => {
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

  const value = useMemo<RoomStoreValue>(
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

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomStore(): RoomStoreValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoomStore must be used inside RoomProvider");
  return ctx;
}

function RoomStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRoomStore();
  const add = () => {
    const id = `room-${entities.length + 1}`;
    upsert({ id, name: `Room ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} rooms, {favorites.length} favorite</p>
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
export function RoomStoreDemo() {
  return (
    <section className="room-store">
      <h2>Room Store</h2>
      <RoomProvider>
        <RoomStoreList />
      </RoomProvider>
    </section>
  );
}
export default RoomStoreDemo;
