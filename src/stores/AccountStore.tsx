import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AccountEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface AccountStoreValue {
  entities: AccountEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<AccountEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: AccountEntity[];
}

const AccountContext = createContext<AccountStoreValue | null>(null);
const CAPACITY = 12;

export function AccountProvider({ children, initial = [] }: { children: ReactNode; initial?: AccountEntity[] }) {
  const [entities, setEntities] = useState<AccountEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<AccountEntity, "updatedAt">) => {
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

  const value = useMemo<AccountStoreValue>(
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

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccountStore(): AccountStoreValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccountStore must be used inside AccountProvider");
  return ctx;
}

function AccountStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAccountStore();
  const add = () => {
    const id = `account-${entities.length + 1}`;
    upsert({ id, name: `Account ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} accounts, {favorites.length} favorite</p>
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
export function AccountStoreDemo() {
  return (
    <section className="account-store">
      <h2>Account Store</h2>
      <AccountProvider>
        <AccountStoreList />
      </AccountProvider>
    </section>
  );
}
export default AccountStoreDemo;
