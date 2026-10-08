import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MenuEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface MenuStoreValue {
  entities: MenuEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<MenuEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: MenuEntity[];
}

const MenuContext = createContext<MenuStoreValue | null>(null);
const CAPACITY = 16;

export function MenuProvider({ children, initial = [] }: { children: ReactNode; initial?: MenuEntity[] }) {
  const [entities, setEntities] = useState<MenuEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<MenuEntity, "updatedAt">) => {
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

  const value = useMemo<MenuStoreValue>(
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

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore(): MenuStoreValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used inside MenuProvider");
  return ctx;
}

function MenuStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useMenuStore();
  const add = () => {
    const id = `menu-${entities.length + 1}`;
    upsert({ id, name: `Menu ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} menus, {favorites.length} favorite</p>
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
export function MenuStoreDemo() {
  return (
    <section className="menu-store">
      <h2>Menu Store</h2>
      <MenuProvider>
        <MenuStoreList />
      </MenuProvider>
    </section>
  );
}
export default MenuStoreDemo;
