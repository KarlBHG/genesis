import type { Metadata } from "next";
import Link from "next/link";

import { HashScroll } from "@/components/hash-scroll";
import { OfficeHolderMismatchChecklist } from "@/components/office-holder-mismatch-checklist";
import { OfficePostsIndex } from "@/components/office-posts-index";
import { PageHero } from "@/components/page-hero";
import { getOfficeMembershipViews } from "@/lib/office-membership";

export const metadata: Metadata = {
  title: "Offices",
  description:
    "Public offices as Posts with time-bounded membership. Vacant stays vacant. A holder field that disagrees with typed holds-office rows is a checklist, not a succession.",
};

export default function OfficesPage() {
  const views = getOfficeMembershipViews();
  const vacant = views.filter((view) => view.vacant).length;
  const mismatches = views.filter((view) => view.mismatch).length;

  return (
    <main className="dashboard-canvas min-w-0">
      <HashScroll />
      <PageHero
        aside={
          <dl className="hero-stat-rail">
            <div>
              <dt>Posts</dt>
              <dd>{views.length}</dd>
            </div>
            <div>
              <dt>Vacant</dt>
              <dd>{vacant}</dd>
            </div>
            <div>
              <dt>Mismatches</dt>
              <dd>{mismatches}</dd>
            </div>
          </dl>
        }
        description={
          <>
            Popolo splits Person, Post, and Membership. Each office page keeps
            the post (title, organization) and lists sourced{" "}
            <span className="font-medium">holds-office</span> rows with start,
            end, as-of, and a permalink. Current means no end date stored and a
            cited as-of. A vacant post is labelled, not filled from{" "}
            <code className="text-sm">offices.json</code>. The contract is on{" "}
            <Link className="underline underline-offset-4" href="/methodology">
              Methodology
            </Link>
            .
          </>
        }
        eyebrow="Post · not one current holder"
        folio="Offices"
        title="Offices"
      />
      <div className="mx-auto flex w-full min-w-0 max-w-shell flex-col gap-10 px-4 py-10 sm:px-6">
        <OfficeHolderMismatchChecklist
          rows={views
            .map((view) => view.mismatch)
            .filter((row): row is NonNullable<typeof row> => row != null)}
        />
        <OfficePostsIndex views={views} />
      </div>
    </main>
  );
}
