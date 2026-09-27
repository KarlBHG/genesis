import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl px-4 py-16 sm:px-6">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No entry for that address</EmptyTitle>
          <EmptyDescription>
            The slug is not in the map. Check the spelling, or go back to the overview.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />}>Back to overview</Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
