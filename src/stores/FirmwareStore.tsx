import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface FirmwareEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface FirmwareStoreValue {
  entities: FirmwareEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<FirmwareEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: FirmwareEntity[];
}

const FirmwareContext = createContext<FirmwareStoreValue | null>(null);
const CAPACITY = 18;

export function FirmwareProvider({ children, initial = [] }: { children: ReactNode; initial?: FirmwareEntity[] }) {
  const [entities, setEntities] = useState<FirmwareEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<FirmwareEntity, "updatedAt">) => {
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

  const value = useMemo<FirmwareStoreValue>(
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

  return <FirmwareContext.Provider value={value}>{children}</FirmwareContext.Provider>;
}

export function useFirmwareStore(): FirmwareStoreValue {
  const ctx = useContext(FirmwareContext);
  if (!ctx) throw new Error("useFirmwareStore must be used inside FirmwareProvider");
  return ctx;
}

function FirmwareStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useFirmwareStore();
  const add = () => {
    const id = `firmware-${entities.length + 1}`;
    upsert({ id, name: `Firmware ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} firmwares, {favorites.length} favorite</p>
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
export function FirmwareStoreDemo() {
  return (
    <section className="firmware-store">
      <h2>Firmware Store</h2>
      <FirmwareProvider>
        <FirmwareStoreList />
      </FirmwareProvider>
    </section>
  );
}
export default FirmwareStoreDemo;
