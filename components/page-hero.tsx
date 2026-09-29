import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  italic?: string;
  description?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  size?: "default" | "dramatic";
  folio?: string;
};

export function PageHero({
  eyebrow,
  title,
  italic,
  description,
  children,
  aside,
  size = "default",
  folio,
}: PageHeroProps) {
  const dramatic = size === "dramatic";

  return (
    <header
      className={`page-hero relative overflow-hidden border-b ${dramatic ? "page-hero-dramatic" : ""}`}
    >
      <div className="page-hero-glow" aria-hidden />
      <div className="page-hero-rule" aria-hidden />
      {folio ? (
        <p className="hero-folio" aria-hidden>
          {folio}
        </p>
      ) : null}
      <div
        className={`relative z-10 mx-auto flex w-full max-w-shell flex-col gap-10 px-4 lg:flex-row lg:items-end lg:justify-between ${
          dramatic ? "py-16 sm:px-6 sm:py-24 lg:py-28" : "py-12 sm:px-6 sm:py-16"
        }`}
      >
        <div className="flex max-w-lede flex-col gap-5">
          {eyebrow ? <p className="kicker fade-rise">{eyebrow}</p> : null}
          <h1
            className={`display-title text-balance ${
              dramatic
                ? "text-[2.65rem] leading-[0.98] sm:text-6xl lg:text-[4.35rem]"
                : "text-3xl sm:text-4xl"
            }`}
          >
            <span className="hero-display block">{title}</span>
            {italic ? (
              <span className="display-italic mt-[0.06em] block">{italic}</span>
            ) : null}
          </h1>
          {description ? (
            <div
              className={`fade-rise-3 max-w-lede ${
                dramatic
                  ? "standfirst-body"
                  : "text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
              }`}
            >
              {description}
            </div>
          ) : null}
          {children}
        </div>
        {aside ? (
          <div className="fade-rise-delayed w-full shrink-0 lg:max-w-sm lg:flex-1">
            {aside}
          </div>
        ) : null}
      </div>
    </header>
  );
}
