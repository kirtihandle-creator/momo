import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface RecipeEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface RecipeStoreValue {
  entities: RecipeEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<RecipeEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: RecipeEntity[];
}

const RecipeContext = createContext<RecipeStoreValue | null>(null);
const CAPACITY = 14;

export function RecipeProvider({ children, initial = [] }: { children: ReactNode; initial?: RecipeEntity[] }) {
  const [entities, setEntities] = useState<RecipeEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<RecipeEntity, "updatedAt">) => {
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

  const value = useMemo<RecipeStoreValue>(
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

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipeStore(): RecipeStoreValue {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error("useRecipeStore must be used inside RecipeProvider");
  return ctx;
}

function RecipeStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useRecipeStore();
  const add = () => {
    const id = `recipe-${entities.length + 1}`;
    upsert({ id, name: `Recipe ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} recipes, {favorites.length} favorite</p>
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
export function RecipeStoreDemo() {
  return (
    <section className="recipe-store">
      <h2>Recipe Store</h2>
      <RecipeProvider>
        <RecipeStoreList />
      </RecipeProvider>
    </section>
  );
}
export default RecipeStoreDemo;
