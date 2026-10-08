import { useEffect, useMemo, useState } from "react";

export interface MeetingRecord {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

export interface MeetingCriteria {
  query: string;
  categories: string[];
  maxPrice: number;
  onlyInStock: boolean;
}

export const MEETING_CATEGORIES = ["north","south","east","west"];
const DEBOUNCE_MS = 250;

export function seedMeetingRecords(count = 12): MeetingRecord[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Meeting ${idx + 1}`,
    category: MEETING_CATEGORIES[idx % MEETING_CATEGORIES.length],
    price: ((idx + 1) * 47) % 500,
    inStock: (idx * 53) % 3 !== 0,
  }));
}

export function applyMeetingCriteria(records: MeetingRecord[], c: MeetingCriteria): MeetingRecord[] {
  const q = c.query.trim().toLowerCase();
  return records.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (c.categories.length && !c.categories.includes(r.category)) return false;
    if (r.price > c.maxPrice) return false;
    if (c.onlyInStock && !r.inStock) return false;
    return true;
  });
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function MeetingFilter({ records }: { records?: MeetingRecord[] }) {
  const all = useMemo(() => records ?? seedMeetingRecords(), [records]);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const debouncedQuery = useDebounced(query, DEBOUNCE_MS);

  const results = useMemo(
    () => applyMeetingCriteria(all, { query: debouncedQuery, categories, maxPrice, onlyInStock }),
    [all, debouncedQuery, categories, maxPrice, onlyInStock],
  );

  const toggleCategory = (cat: string) =>
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  const reset = () => { setQuery(""); setCategories([]); setMaxPrice(500); setOnlyInStock(false); };
  const activeCount = (query ? 1 : 0) + (categories.length ? 1 : 0) + (maxPrice < 500 ? 1 : 0) + (onlyInStock ? 1 : 0);

  return (
    <section className="meeting-filter">
      <h2>Meeting Filter</h2>
      <input placeholder="Search meetings" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div>
        {MEETING_CATEGORIES.map((cat) => (
          <label key={cat}>
            <input type="checkbox" checked={categories.includes(cat)} onChange={() => toggleCategory(cat)} /> {cat}
          </label>
        ))}
      </div>
      <label>
        Max price {maxPrice}
        <input type="range" min={0} max={500} step={10} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
      </label>
      <label>
        <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} /> In stock only
      </label>
      <p>{results.length} of {all.length} match, {activeCount} filters active <button type="button" onClick={reset} disabled={!activeCount}>clear</button></p>
      <ul>
        {results.map((r) => <li key={r.id}>{r.name} / {r.category} / {r.price} {r.inStock ? "" : "(out of stock)"}</li>)}
      </ul>
    </section>
  );
}






export default MeetingFilter;
