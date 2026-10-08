import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MessageEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface MessageStoreValue {
  entities: MessageEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<MessageEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: MessageEntity[];
}

const MessageContext = createContext<MessageStoreValue | null>(null);
const CAPACITY = 18;

export function MessageProvider({ children, initial = [] }: { children: ReactNode; initial?: MessageEntity[] }) {
  const [entities, setEntities] = useState<MessageEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<MessageEntity, "updatedAt">) => {
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

  const value = useMemo<MessageStoreValue>(
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

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessageStore(): MessageStoreValue {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessageStore must be used inside MessageProvider");
  return ctx;
}

function MessageStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useMessageStore();
  const add = () => {
    const id = `message-${entities.length + 1}`;
    upsert({ id, name: `Message ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} messages, {favorites.length} favorite</p>
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
export function MessageStoreDemo() {
  return (
    <section className="message-store">
      <h2>Message Store</h2>
      <MessageProvider>
        <MessageStoreList />
      </MessageProvider>
    </section>
  );
}
export default MessageStoreDemo;
