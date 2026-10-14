import { Badge } from "@/components/ui/badge";
import { asOfMeta, type AsOfBucket } from "@/lib/as-of";

const BUCKET_VARIANT: Record<
  AsOfBucket,
  "default" | "secondary" | "outline" | "destructive"
> = {
  iso: "secondary",
  year: "outline",
  undated: "outline",
  statute: "outline",
};

export function AsOfChip({ asOf }: { asOf: string }) {
  if (!asOf.trim()) return null;
  const meta = asOfMeta(asOf);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      <Badge className="font-normal" variant={BUCKET_VARIANT[meta.bucket]}>
        {meta.bucketLabel}
      </Badge>
      <span className="text-muted-foreground">{meta.display}</span>
    </span>
  );
}
