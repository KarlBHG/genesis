import {
  METHODOLOGY_HREF,
  PRINT_COLOPHON,
  printFolio,
  printRunningHead,
} from "@/lib/print-plate";

type PrintPlateHeadProps = {
  kind: string;
  slug: string;
  asOf: string;
  pathname: string;
};

/** Print-only running head and plate number. Hidden on screen. */
export function PrintPlateHead({
  kind,
  slug,
  asOf,
  pathname,
}: PrintPlateHeadProps) {
  const folio = printFolio(pathname);
  return (
    <header className="print-only print-plate" data-print-plate="">
      <p className="print-plate-running">
        <span data-print-running-head="">{printRunningHead(kind, slug, asOf)}</span>
        {folio ? (
          <span aria-label={`Plate ${folio}`} data-print-folio="">
            {folio}
          </span>
        ) : null}
      </p>
    </header>
  );
}

/** Print-only colophon. Hidden on screen. No live “retrieved” clock. */
export function PrintPlateColophon() {
  return (
    <footer className="print-only print-colophon" data-print-colophon="">
      <p>{PRINT_COLOPHON}</p>
      <p>
        Methodology{" "}
        <a className="print-literal-url" href={METHODOLOGY_HREF}>
          {METHODOLOGY_HREF}
        </a>
      </p>
    </footer>
  );
}
