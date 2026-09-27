import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EntryIndex({
  items,
}: {
  items: { title: string; href: string; summary: string; meta: string }[];
}) {
  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <li key={item.href}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Link className="underline underline-offset-4" href={item.href}>
                  {item.title}
                </Link>
              </CardTitle>
              <CardDescription className="flex flex-col gap-2">
                <Badge className="w-fit" variant="outline">
                  {item.meta}
                </Badge>
                <span>{item.summary}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}
