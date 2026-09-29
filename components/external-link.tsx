import type { ReactNode } from "react";

import { classifyHref } from "@/lib/safe-href";

/**
 * Citation and website links leave the atlas. Unsafe schemes render as text
 * instead of becoming an href.
 */
export function ExternalLink({
  href,
  children,
  className,
  title,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const safe = classifyHref(href);
  if (safe.kind !== "external") {
    return <span className={className}>{children}</span>;
  }
  return (
    <a
      className={className}
      href={safe.href}
      rel="noopener noreferrer"
      target="_blank"
      title={title}
    >
      {children}
    </a>
  );
}
