import Link from "next/link";

export function EntryIndex({
  items,
}: {
  items: { title: string; href: string; summary: string; meta: string }[];
}) {
  return (
    <ul className="folio-index">
      {items.map((item) => (
        <li className="folio-index-row" key={item.href}>
          <p className="folio-index-meta">{item.meta}</p>
          <Link className="folio-index-title" href={item.href}>
            {item.title}
          </Link>
          <p className="folio-index-summary">{item.summary}</p>
        </li>
      ))}
    </ul>
  );
}
