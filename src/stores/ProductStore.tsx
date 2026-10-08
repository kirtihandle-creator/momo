import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ProductEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ProductStoreValue {
  entities: ProductEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ProductEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ProductEntity[];
}

const ProductContext = createContext<ProductStoreValue | null>(null);
const CAPACITY = 13;

export function ProductProvider({ children, initial = [] }: { children: ReactNode; initial?: ProductEntity[] }) {
  const [entities, setEntities] = useState<ProductEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ProductEntity, "updatedAt">) => {
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

  const value = useMemo<ProductStoreValue>(
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

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProductStore(): ProductStoreValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProductStore must be used inside ProductProvider");
  return ctx;
}

function ProductStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useProductStore();
  const add = () => {
    const id = `product-${entities.length + 1}`;
    upsert({ id, name: `Product ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} products, {favorites.length} favorite</p>
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
export function ProductStoreDemo() {
  return (
    <section className="product-store">
      <h2>Product Store</h2>
      <ProductProvider>
        <ProductStoreList />
      </ProductProvider>
    </section>
  );
}
export default ProductStoreDemo;
