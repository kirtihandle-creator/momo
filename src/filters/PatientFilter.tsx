import { useEffect, useMemo, useState } from "react";

export interface PatientRecord {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

export interface PatientCriteria {
  query: string;
  categories: string[];
  maxPrice: number;
  onlyInStock: boolean;
}

export const PATIENT_CATEGORIES = ["red","green","blue","amber"];
const DEBOUNCE_MS = 350;

export function seedPatientRecords(count = 20): PatientRecord[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Patient ${idx + 1}`,
    category: PATIENT_CATEGORIES[idx % PATIENT_CATEGORIES.length],
    price: ((idx + 1) * 34) % 500,
    inStock: (idx * 91) % 3 !== 0,
  }));
}

export function applyPatientCriteria(records: PatientRecord[], c: PatientCriteria): PatientRecord[] {
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

export function PatientFilter({ records }: { records?: PatientRecord[] }) {
  const all = useMemo(() => records ?? seedPatientRecords(), [records]);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const debouncedQuery = useDebounced(query, DEBOUNCE_MS);

  const results = useMemo(
    () => applyPatientCriteria(all, { query: debouncedQuery, categories, maxPrice, onlyInStock }),
    [all, debouncedQuery, categories, maxPrice, onlyInStock],
  );

  const toggleCategory = (cat: string) =>
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  const reset = () => { setQuery(""); setCategories([]); setMaxPrice(500); setOnlyInStock(false); };
  const activeCount = (query ? 1 : 0) + (categories.length ? 1 : 0) + (maxPrice < 500 ? 1 : 0) + (onlyInStock ? 1 : 0);

  return (
    <section className="patient-filter">
      <h2>Patient Filter</h2>
      <input placeholder="Search patients" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div>
        {PATIENT_CATEGORIES.map((cat) => (
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






export default PatientFilter;
