import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  size?: "default" | "dramatic";
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  aside,
  size = "default",
}: PageHeroProps) {
  return (
    <header
      className={`page-hero relative overflow-hidden border-b ${size === "dramatic" ? "page-hero-dramatic" : ""}`}
    >
      <div className="page-hero-glow" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-shell flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="fade-rise flex max-w-lede flex-col gap-4">
          {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
          <h1
            className={`font-medium text-balance ${
              size === "dramatic"
                ? "text-4xl sm:text-5xl lg:text-[3.55rem] lg:leading-[1.04]"
                : "text-3xl sm:text-4xl"
            }`}
          >
            {title}
          </h1>
          {description ? (
            <div className="max-w-lede text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {description}
            </div>
          ) : null}
          {children}
        </div>
        {aside ? (
          <div className="fade-rise-delayed w-full shrink-0 lg:max-w-md lg:flex-1">
            {aside}
          </div>
        ) : null}
      </div>
    </header>
  );
}
