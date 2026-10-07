import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function Section({ title, href, linkLabel = "לכל המוצרים", children, id }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="container-page mt-14 sm:mt-16" aria-labelledby={id}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id={id} className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-700">
            {linkLabel}
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
