import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Programs",
  description: "Government programs now live on the budget home.",
};

export default function ProgramsPage() {
  redirect("/money#government-programs");
}
