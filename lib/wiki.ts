export type WikiTarget = {
  title: string;
  href: string;
};

const WIKI_LINK = /\[\[([a-z0-9-]+)\]\]/g;

export function applyWikiLinks(
  markdown: string,
  resolve: (slug: string) => WikiTarget | null,
): string {
  return markdown.replace(WIKI_LINK, (_match, slug: string) => {
    const target = resolve(slug);
    if (!target) {
      return `[${slug}](unresolved:${slug})`;
    }
    return `[${target.title}](${target.href})`;
  });
}
