import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Children, isValidElement, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { icelandicLang } from "@/lib/lang";
import { applyWikiLinks } from "@/lib/wiki";

/** Flattens a rendered quote back to text so it can be classified. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return Children.toArray(node.props.children).map(textOf).join("");
  }
  return "";
}

function quotationLang(children: ReactNode): "is" | undefined {
  return icelandicLang(textOf(children));
}

export function MarkdownBody({ source }: { source: string }) {
  if (!source.trim()) return null;
  const linked = applyWikiLinks(source, resolveSlug);

  return (
    <div className="entry-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Body quotes are lifted from the cited page, so they are usually
          // Icelandic inside an otherwise English entry.
          blockquote: ({ children }) => (
            <blockquote lang={quotationLang(children)}>{children}</blockquote>
          ),
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
