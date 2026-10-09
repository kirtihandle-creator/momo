export interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return <nav aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={`${index}-${item.label}`} aria-current={index === items.length - 1 ? "page" : undefined}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}</li>)}</ol></nav>;
}
