import { Button } from "./Button";

/** Pages are one-based. Invalid numbers fall back to the first page. */
export function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  const count = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const current = Number.isFinite(page) ? Math.min(count, Math.max(1, Math.floor(page))) : 1;
  return <nav aria-label="Pagination"><Button disabled={current === 1} onClick={() => onPageChange(current - 1)}>Previous</Button><span aria-live="polite"> Page {current} of {count} </span><Button disabled={current === count} onClick={() => onPageChange(current + 1)}>Next</Button></nav>;
}
