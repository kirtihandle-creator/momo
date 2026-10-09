# momo reviewer notes

## Architecture
This is a Vite-powered React 18 + TypeScript application, with `src/App.tsx` acting as a large composition/gallery entry point for domain widgets. Domain components are organized into `src/components`, `src/editors`, and `src/views`, while reusable primitives live in `src/ui` and chart implementations in `src/charts`. The project is client-side only in the sampled files and has no runtime dependencies beyond React.

## Conventions
- Use strict TypeScript-compatible React code: `tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, and `noEmit`; changes must continue to pass `npm run build`.
- Components use named exports and commonly also provide a default export. For example, `src/charts/AccountChart.tsx` exports both `AccountChart` and `default AccountChart`.
- Chart files follow a deliberately consistent per-domain naming scheme: `AccountPoint`, `AccountChartMode`, `AccountChartProps`, `generateAccountSeries`, and `AccountChart` in `src/charts/AccountChart.tsx`; the same pattern appears in `AlbumChart.tsx`, `AlertChart.tsx`, and related files.
- Charts accept optional `title`, `data`, `width`, and `height`, derive fallback data with `useMemo`, and support `"bar"`/`"line"` modes with local `useState`; preserve this API shape when adding charts.
- Shared UI components are controlled where applicable. Keep state in consumers, as documented in `src/ui/README.md`; use explicit `type="submit"` for submitting buttons because `Button` defaults to `"button"`.
- Shared form controls should use their native attributes and accessible labels/error links. `Card` provides an accessible heading, and status badges must include text rather than relying only on color (`src/ui/README.md`).
- New domain widgets should be registered through the corresponding structure in `src/App.tsx`; the entry point imports component, editor, and view variants from their respective directories.

## Intentional non-standard choices
- The many nearly identical domain-specific chart files are intentional specialization, not accidental duplication: each has its own point type, generator, CSS class, default title, and seed (for example `src/charts/AccountChart.tsx` versus `src/charts/AlbumChart.tsx`).
- Chart fallback data is deterministic pseudo-random data generated from a local linear-congruential sequence, rather than using `Math.random()` (`src/charts/AccountChart.tsx`).
- Charts use inline SVG primitives and literal colors, with no charting package or stylesheet dependency (`package.json`, `src/charts/AccountChart.tsx`).

## Watch out for
- Preserve unique React keys: charts currently key points by `p.label`; generated labels must remain unique, and supplied data should not contain duplicate labels (`src/charts/AccountChart.tsx`).
- Check `useMemo` dependencies when changing chart dimensions. The path memo depends on `series`, `step`, and `max`, but its `y()` calculation also uses `height`/`innerH`; resizing behavior can become stale (`src/charts/AccountChart.tsx`).
- Do not introduce unused imports, props, or locals; the TypeScript configuration treats these as build failures (`tsconfig.json`).
- Avoid replacing native accessible controls with custom equivalents in `src/ui`; `Disclosure` intentionally uses native browser interaction, and controlled components require consumer-owned state (`src/ui/README.md`).