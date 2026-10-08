import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MemberEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface MemberStoreValue {
  entities: MemberEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<MemberEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: MemberEntity[];
}

const MemberContext = createContext<MemberStoreValue | null>(null);
const CAPACITY = 21;

export function MemberProvider({ children, initial = [] }: { children: ReactNode; initial?: MemberEntity[] }) {
  const [entities, setEntities] = useState<MemberEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<MemberEntity, "updatedAt">) => {
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

  const value = useMemo<MemberStoreValue>(
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

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMemberStore(): MemberStoreValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMemberStore must be used inside MemberProvider");
  return ctx;
}

function MemberStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useMemberStore();
  const add = () => {
    const id = `member-${entities.length + 1}`;
    upsert({ id, name: `Member ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} members, {favorites.length} favorite</p>
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
export function MemberStoreDemo() {
  return (
    <section className="member-store">
      <h2>Member Store</h2>
      <MemberProvider>
        <MemberStoreList />
      </MemberProvider>
    </section>
  );
}
export default MemberStoreDemo;
