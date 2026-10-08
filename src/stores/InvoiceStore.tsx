import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface InvoiceEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface InvoiceStoreValue {
  entities: InvoiceEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<InvoiceEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: InvoiceEntity[];
}

const InvoiceContext = createContext<InvoiceStoreValue | null>(null);
const CAPACITY = 11;

export function InvoiceProvider({ children, initial = [] }: { children: ReactNode; initial?: InvoiceEntity[] }) {
  const [entities, setEntities] = useState<InvoiceEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<InvoiceEntity, "updatedAt">) => {
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

  const value = useMemo<InvoiceStoreValue>(
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

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
}

export function useInvoiceStore(): InvoiceStoreValue {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error("useInvoiceStore must be used inside InvoiceProvider");
  return ctx;
}

function InvoiceStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useInvoiceStore();
  const add = () => {
    const id = `invoice-${entities.length + 1}`;
    upsert({ id, name: `Invoice ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} invoices, {favorites.length} favorite</p>
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
export function InvoiceStoreDemo() {
  return (
    <section className="invoice-store">
      <h2>Invoice Store</h2>
      <InvoiceProvider>
        <InvoiceStoreList />
      </InvoiceProvider>
    </section>
  );
}
export default InvoiceStoreDemo;
