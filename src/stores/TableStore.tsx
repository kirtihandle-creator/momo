import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TableEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TableStoreValue {
  entities: TableEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<TableEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: TableEntity[];
}

const TableContext = createContext<TableStoreValue | null>(null);
const CAPACITY = 18;

export function TableProvider({ children, initial = [] }: { children: ReactNode; initial?: TableEntity[] }) {
  const [entities, setEntities] = useState<TableEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<TableEntity, "updatedAt">) => {
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

  const value = useMemo<TableStoreValue>(
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

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

export function useTableStore(): TableStoreValue {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("useTableStore must be used inside TableProvider");
  return ctx;
}

function TableStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useTableStore();
  const add = () => {
    const id = `table-${entities.length + 1}`;
    upsert({ id, name: `Table ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} tables, {favorites.length} favorite</p>
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
export function TableStoreDemo() {
  return (
    <section className="table-store">
      <h2>Table Store</h2>
      <TableProvider>
        <TableStoreList />
      </TableProvider>
    </section>
  );
}
export default TableStoreDemo;
