import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Children, isValidElement, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { resolveSlug } from "@/lib/content";
import { icelandicLang } from "@/lib/lang";
import { classifyHref } from "@/lib/safe-href";
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

function markdownUrlTransform(value: string): string {
  const safe = classifyHref(value);
  if (safe.kind === "blocked") return "";
  if (safe.kind === "unresolved") return value;
  return safe.href;
}

export function MarkdownBody({ source }: { source: string }) {
  if (!source.trim()) return null;
  const linked = applyWikiLinks(source, resolveSlug);

  return (
    <div className="entry-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={markdownUrlTransform}
        components={{
          // Body quotes are lifted from the cited page, so they are usually
          // Icelandic inside an otherwise English entry.
          blockquote: ({ children }) => (
            <blockquote lang={quotationLang(children)}>{children}</blockquote>
          ),
          img: () => null,
          a: ({ href, children }) => {
            const safe = classifyHref(href);
            if (safe.kind === "unresolved") {
              return (
                <Badge variant="outline">
                  Unresolved reference: {safe.slug}
                </Badge>
              );
            }
            if (safe.kind === "internal") {
              return <Link href={safe.href}>{children}</Link>;
            }
            if (safe.kind === "external") {
              return (
                <a href={safe.href} rel="noopener noreferrer" target="_blank">
                  {children}
                </a>
              );
            }
            return <span>{children}</span>;
          },
        }}
      >
        {linked}
      </ReactMarkdown>
    </div>
  );
}
