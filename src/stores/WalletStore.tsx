import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface WalletEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface WalletStoreValue {
  entities: WalletEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<WalletEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: WalletEntity[];
}

const WalletContext = createContext<WalletStoreValue | null>(null);
const CAPACITY = 14;

export function WalletProvider({ children, initial = [] }: { children: ReactNode; initial?: WalletEntity[] }) {
  const [entities, setEntities] = useState<WalletEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<WalletEntity, "updatedAt">) => {
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

  const value = useMemo<WalletStoreValue>(
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

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletStore(): WalletStoreValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletStore must be used inside WalletProvider");
  return ctx;
}

function WalletStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useWalletStore();
  const add = () => {
    const id = `wallet-${entities.length + 1}`;
    upsert({ id, name: `Wallet ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} wallets, {favorites.length} favorite</p>
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
export function WalletStoreDemo() {
  return (
    <section className="wallet-store">
      <h2>Wallet Store</h2>
      <WalletProvider>
        <WalletStoreList />
      </WalletProvider>
    </section>
  );
}
export default WalletStoreDemo;
