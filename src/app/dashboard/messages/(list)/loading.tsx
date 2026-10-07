import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="טוען הודעות">
      <Skeleton className="mb-5 h-9 w-40" />
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}
