import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TransactionEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TransactionStoreValue {
  entities: TransactionEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TransactionEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TransactionEntity[];
}

const TransactionContext = createContext<TransactionStoreValue | null>(null);
const CAPACITY = 13;

export function TransactionProvider({ children, initial = [] }: { children: ReactNode; initial?: TransactionEntity[] }) {
  const [entities, setEntities] = useState<TransactionEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TransactionEntity, "updatedAt">) => {
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

  const value = useMemo<TransactionStoreValue>(
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

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactionStore(): TransactionStoreValue {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactionStore must be used inside TransactionProvider");
  return ctx;
}

function TransactionStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTransactionStore();
  const add = () => {
    const id = `transaction-${entities.length + 1}`;
    upsert({ id, name: `Transaction ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} transactions, {favorites.length} favorite</p>
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
export function TransactionStoreDemo() {
  return (
    <section className="transaction-store">
      <h2>Transaction Store</h2>
      <TransactionProvider>
        <TransactionStoreList />
      </TransactionProvider>
    </section>
  );
}
export default TransactionStoreDemo;
