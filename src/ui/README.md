# Shared UI components

18 small React components for use in the existing widgets. Import from `src/ui`
using a relative path appropriate to your component. No extra packages or stylesheets
are required. These components are available for reuse; they are not registered
as standalone demos in the application gallery.

```tsx
import { useState } from "react";
import { Card, SearchInput, EmptyState } from "../ui";

export function SearchExample() {
  const [query, setQuery] = useState("");
  return (
    <Card title="Search records">
      <SearchInput value={query} onChange={setQuery} />
      <EmptyState message={query ? `No matches for ${query}.` : "Enter a search term."} />
    </Card>
  );
}
```

| Component | Purpose |
| --- | --- |
| Button | Native button, defaults to `type="button"` |
| Badge | Neutral, success, or warning label |
| Card | Titled section with an accessible heading |
| EmptyState | Empty message and optional action |
| LoadingIndicator | Live loading status |
| ErrorMessage | Error announcement and optional retry |
| SearchInput | Labeled, controlled search field |
| TextField | Native input with optional linked error text |
| TextAreaField | Labeled native textarea |
| SelectField | Labeled select with supplied options |
| CheckboxField | Labeled native checkbox |
| Disclosure | Native expandable details |
| ProgressBar | Labeled progress; omit value for indeterminate progress |
| StatCard | Metric label, value, and optional description |
| Breadcrumbs | Navigation path; last item marks the current page |
| Pagination | Controlled one-based previous/next navigation |
| ToggleButton | Controlled button with pressed state |
| DefinitionList | Labeled values with stable item IDs |

Keep state in the consuming widget for controlled components. Use unique values
for select options and unique IDs for definition items. Supply descriptive labels
and include status wording in badges so color is not the only status cue.
TextField, TextAreaField, SelectField, CheckboxField, and Button accept native
attributes including disabled state and event handlers. Set `type="submit"`
explicitly for form submission. Disclosure uses native browser interaction;
`defaultOpen` sets its initial open state.

Run `npm run build` from the project root to type-check all components and build
the application.
