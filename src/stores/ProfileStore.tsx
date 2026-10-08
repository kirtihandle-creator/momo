import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ProfileEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ProfileStoreValue {
  entities: ProfileEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ProfileEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ProfileEntity[];
}

const ProfileContext = createContext<ProfileStoreValue | null>(null);
const CAPACITY = 17;

export function ProfileProvider({ children, initial = [] }: { children: ReactNode; initial?: ProfileEntity[] }) {
  const [entities, setEntities] = useState<ProfileEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ProfileEntity, "updatedAt">) => {
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

  const value = useMemo<ProfileStoreValue>(
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

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileStore(): ProfileStoreValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfileStore must be used inside ProfileProvider");
  return ctx;
}

function ProfileStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useProfileStore();
  const add = () => {
    const id = `profile-${entities.length + 1}`;
    upsert({ id, name: `Profile ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} profiles, {favorites.length} favorite</p>
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
export function ProfileStoreDemo() {
  return (
    <section className="profile-store">
      <h2>Profile Store</h2>
      <ProfileProvider>
        <ProfileStoreList />
      </ProfileProvider>
    </section>
  );
}
export default ProfileStoreDemo;
