import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface NoteEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface NoteStoreValue {
  entities: NoteEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<NoteEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: NoteEntity[];
}

const NoteContext = createContext<NoteStoreValue | null>(null);
const CAPACITY = 17;

export function NoteProvider({ children, initial = [] }: { children: ReactNode; initial?: NoteEntity[] }) {
  const [entities, setEntities] = useState<NoteEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<NoteEntity, "updatedAt">) => {
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

  const value = useMemo<NoteStoreValue>(
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

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}

export function useNoteStore(): NoteStoreValue {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error("useNoteStore must be used inside NoteProvider");
  return ctx;
}

function NoteStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useNoteStore();
  const add = () => {
    const id = `note-${entities.length + 1}`;
    upsert({ id, name: `Note ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} notes, {favorites.length} favorite</p>
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
export function NoteStoreDemo() {
  return (
    <section className="note-store">
      <h2>Note Store</h2>
      <NoteProvider>
        <NoteStoreList />
      </NoteProvider>
    </section>
  );
}
export default NoteStoreDemo;
