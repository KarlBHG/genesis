import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { applyWikiLinks } from "@/lib/wiki";

export function MarkdownBody({ source }: { source: string }) {
  if (!source.trim()) return null;
  const linked = applyWikiLinks(source, resolveSlug);

  return (
    <div className="entry-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            if (href.startsWith("unresolved:")) {
              return (
                <Badge variant="outline">
                  Unresolved reference: {href.slice("unresolved:".length)}
                </Badge>
              );
            }
            if (href.startsWith("/")) {
              return <Link href={href}>{children}</Link>;
            }
            return (
              <a href={href} rel="noreferrer" target="_blank">
                {children}
              </a>
            );
          },
        }}
      >
        {linked}
      </ReactMarkdown>
    </div>
  );
}
