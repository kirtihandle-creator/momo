import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ProjectEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}

export interface ProjectStoreValue {
  entities: ProjectEntity[];
  selectedId: string | null;
  select: (id: string | null) => void;
  upsert: (entity: Omit<ProjectEntity, "updatedAt">) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  favorites: ProjectEntity[];
}

const ProjectContext = createContext<ProjectStoreValue | null>(null);
const CAPACITY = 18;

export function ProjectProvider({ children, initial = [] }: { children: ReactNode; initial?: ProjectEntity[] }) {
  const [entities, setEntities] = useState<ProjectEntity[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsert = useCallback((entity: Omit<ProjectEntity, "updatedAt">) => {
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

  const value = useMemo<ProjectStoreValue>(
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

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectStore(): ProjectStoreValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectStore must be used inside ProjectProvider");
  return ctx;
}

function ProjectStoreList() {
  const { entities, selectedId, select, upsert, remove, toggleFavorite, favorites } = useProjectStore();
  const add = () => {
    const id = `project-${entities.length + 1}`;
    upsert({ id, name: `Project ${entities.length + 1}`, favorite: false });
  };
  return (
    <div>
      <p>{entities.length} of {CAPACITY} projects, {favorites.length} favorite</p>
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
export function ProjectStoreDemo() {
  return (
    <section className="project-store">
      <h2>Project Store</h2>
      <ProjectProvider>
        <ProjectStoreList />
      </ProjectProvider>
    </section>
  );
}
export default ProjectStoreDemo;
