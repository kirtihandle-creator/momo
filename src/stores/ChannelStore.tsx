import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ChannelEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ChannelStoreValue {
  entities: ChannelEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ChannelEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ChannelEntity[];
}

const ChannelContext = createContext<ChannelStoreValue | null>(null);
const CAPACITY = 17;

export function ChannelProvider({ children, initial = [] }: { children: ReactNode; initial?: ChannelEntity[] }) {
  const [entities, setEntities] = useState<ChannelEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ChannelEntity, "updatedAt">) => {
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

  const value = useMemo<ChannelStoreValue>(
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

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannelStore(): ChannelStoreValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error("useChannelStore must be used inside ChannelProvider");
  return ctx;
}

function ChannelStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useChannelStore();
  const add = () => {
    const id = `channel-${entities.length + 1}`;
    upsert({ id, name: `Channel ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} channels, {favorites.length} favorite</p>
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
export function ChannelStoreDemo() {
  return (
    <section className="channel-store">
      <h2>Channel Store</h2>
      <ChannelProvider>
        <ChannelStoreList />
      </ChannelProvider>
    </section>
  );
}
export default ChannelStoreDemo;
