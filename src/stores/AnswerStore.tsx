import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AnswerEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}
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

  return <AnswerContext.Provider value={value}>{children}</AnswerContext.Provider>;
}

export function useAnswerStore(): AnswerStoreValue {
  const ctx = useContext(AnswerContext);
  if (!ctx) throw new Error("useAnswerStore must be used inside AnswerProvider");
  return ctx;
}

function AnswerStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useAnswerStore();
  const add = () => {
    const id = `answer-${entities.length + 1}`;
    upsert({ id, name: `Answer ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} answers, {favorites.length} favorite</p>
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
export function AnswerStoreDemo() {
  return (
    <section className="answer-store">
      <h2>Answer Store</h2>
      <AnswerProvider>
        <AnswerStoreList />
      </AnswerProvider>
    </section>
  );
}
export default AnswerStoreDemo;
