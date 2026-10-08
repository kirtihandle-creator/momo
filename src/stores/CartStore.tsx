import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CartEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface CartStoreValue {
  entities: CartEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<CartEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: CartEntity[];
}

const CartContext = createContext<CartStoreValue | null>(null);
const CAPACITY = 10;

export function CartProvider({ children, initial = [] }: { children: ReactNode; initial?: CartEntity[] }) {
  const [entities, setEntities] = useState<CartEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<CartEntity, "updatedAt">) => {
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

  const value = useMemo<CartStoreValue>(
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartStore(): CartStoreValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartStore must be used inside CartProvider");
  return ctx;
}

function CartStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useCartStore();
  const add = () => {
    const id = `cart-${entities.length + 1}`;
    upsert({ id, name: `Cart ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} carts, {favorites.length} favorite</p>
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
export function CartStoreDemo() {
  return (
    <section className="cart-store">
      <h2>Cart Store</h2>
      <CartProvider>
        <CartStoreList />
      </CartProvider>
    </section>
  );
}
export default CartStoreDemo;
