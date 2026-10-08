import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ContractEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ContractStoreValue {
  entities: ContractEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ContractEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ContractEntity[];
}

const ContractContext = createContext<ContractStoreValue | null>(null);
const CAPACITY = 15;

export function ContractProvider({ children, initial = [] }: { children: ReactNode; initial?: ContractEntity[] }) {
  const [entities, setEntities] = useState<ContractEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ContractEntity, "updatedAt">) => {
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

  const value = useMemo<ContractStoreValue>(
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

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
}

export function useContractStore(): ContractStoreValue {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContractStore must be used inside ContractProvider");
  return ctx;
}

function ContractStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useContractStore();
  const add = () => {
    const id = `contract-${entities.length + 1}`;
    upsert({ id, name: `Contract ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} contracts, {favorites.length} favorite</p>
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
export function ContractStoreDemo() {
  return (
    <section className="contract-store">
      <h2>Contract Store</h2>
      <ContractProvider>
        <ContractStoreList />
      </ContractProvider>
    </section>
  );
}
export default ContractStoreDemo;
