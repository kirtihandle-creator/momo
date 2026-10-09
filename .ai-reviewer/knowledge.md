# momo reviewer notes

## Architecture

This is a Vite-powered React 18 + TypeScript application, with strict type-checking and no runtime dependencies beyond React (`package.json`, `tsconfig.json`). `src/App.tsx` acts as a large application/gallery composition root, importing domain widgets from `src/components`, editors from `src/editors`, views from `src/views`, and charts from `src/charts`. Reusable presentational controls live under `src/ui`; charts are self-contained SVG React components.

## Conventions

- Use TypeScript React components in `.tsx` files and ES module imports/exports; the project uses `"type": "module"` and `jsx: "react-jsx"` (`package.json`, `tsconfig.json`).
- Keep reusable UI components under `src/ui` and import them with relative paths, as shown in `src/ui/README.md`.
- Controlled UI components keep their state in the consuming widget. `SearchInput`, for example, receives `value` and `onChange`; form controls accept native attributes (`src/ui/README.md`).
- Buttons default to non-submit behavior; use `type="submit"` explicitly in forms (`src/ui/README.md`). Existing chart mode controls follow this rule (`src/charts/AccountChart.tsx`).
- Charts follow a repeated domain-specific naming pattern: `{Domain}Point`, `{Domain}ChartMode`, `{Domain}ChartProps`, `generate{Domain}Series`, and `{Domain}Chart` (`src/charts/AccountChart.tsx`, `src/charts/AlbumChart.tsx`).
- Chart components accept optional `title`, `data`, `width`, and `height`, provide deterministic generated fallback data, and expose both named and default exports (`src/charts/AccountChart.tsx`).
- Chart rendering is native SVG rather than a charting package. Shared visual behavior includes `PADDING = 24`, bar/line mode switching, hover state, average/trend annotations, and `role="img"` with an accessible label (`src/charts/AccountChart.tsx`).
- Maintain strict TypeScript cleanliness: `strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, and `noEmit` are enabled (`tsconfig.json`). The expected validation command is `npm run build`, which type-checks before running `vite build` (`package.json`, `src/ui/README.md`).

## Intentional non-standard choices

- The repository/package identity differs: the repository is `momo`, while `package.json` names the package `snaclite`. Do not flag this as a build issue without evidence that package metadata is required to match.
- Many chart files intentionally duplicate nearly identical implementations with domain-specific types, class names, seeds, and defaults (`src/charts/AccountChart.tsx`, `src/charts/AlbumChart.tsx`, `src/charts/AlertChart.tsx`).
- Generated chart data uses a small deterministic linear-congruential calculation rather than `Math.random()`, making fallback charts stable (`src/charts/AccountChart.tsx`).
- Extra blank lines at the ends of chart files and default exports alongside named exports are established patterns, not necessarily accidental (`src/charts/AccountChart.tsx`).

## Watch out for

- Do not add UI libraries, charting packages, or standalone stylesheets for shared UI; the documented UI layer deliberately has no extra packages or stylesheets (`src/ui/README.md`).
- Preserve unique React keys for chart points (`key={p.label}`) and unique IDs for definition-list items (`src/ui/README.md`).
- Flag changes that remove accessible labels, status wording, linked error text, or native control semantics from shared UI and SVG components (`src/ui/README.md`, `src/charts/AccountChart.tsx`).
- Check new code against strict unused-variable/unused-parameter rules; `npm run build` will fail on violations.