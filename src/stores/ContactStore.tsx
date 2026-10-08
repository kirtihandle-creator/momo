import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ContactEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ContactStoreValue {
  entities: ContactEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ContactEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ContactEntity[];
}

const ContactContext = createContext<ContactStoreValue | null>(null);
const CAPACITY = 20;

export function ContactProvider({ children, initial = [] }: { children: ReactNode; initial?: ContactEntity[] }) {
  const [entities, setEntities] = useState<ContactEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ContactEntity, "updatedAt">) => {
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

  const value = useMemo<ContactStoreValue>(
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

  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>;
}

export function useContactStore(): ContactStoreValue {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContactStore must be used inside ContactProvider");
  return ctx;
}

function ContactStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useContactStore();
  const add = () => {
    const id = `contact-${entities.length + 1}`;
    upsert({ id, name: `Contact ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} contacts, {favorites.length} favorite</p>
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
export function ContactStoreDemo() {
  return (
    <section className="contact-store">
      <h2>Contact Store</h2>
      <ContactProvider>
        <ContactStoreList />
      </ContactProvider>
    </section>
  );
}
export default ContactStoreDemo;
