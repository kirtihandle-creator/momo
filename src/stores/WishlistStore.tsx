import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface WishlistEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface WishlistStoreValue {
  entities: WishlistEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<WishlistEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: WishlistEntity[];
}

const WishlistContext = createContext<WishlistStoreValue | null>(null);
const CAPACITY = 11;

export function WishlistProvider({ children, initial = [] }: { children: ReactNode; initial?: WishlistEntity[] }) {
  const [entities, setEntities] = useState<WishlistEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<WishlistEntity, "updatedAt">) => {
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

  const value = useMemo<WishlistStoreValue>(
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

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlistStore(): WishlistStoreValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlistStore must be used inside WishlistProvider");
  return ctx;
}

function WishlistStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useWishlistStore();
  const add = () => {
    const id = `wishlist-${entities.length + 1}`;
    upsert({ id, name: `Wishlist ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} wishlists, {favorites.length} favorite</p>
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
export function WishlistStoreDemo() {
  return (
    <section className="wishlist-store">
      <h2>Wishlist Store</h2>
      <WishlistProvider>
        <WishlistStoreList />
      </WishlistProvider>
    </section>
  );
}
export default WishlistStoreDemo;
