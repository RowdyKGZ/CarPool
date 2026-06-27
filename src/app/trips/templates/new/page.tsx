import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { TripTemplateNewForm } from "./template-form";

export default async function TripTemplateNewPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates/new");
  }

  const c = ruContent.tripTemplateNew;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/trips/templates"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {ruContent.tripTemplates.title}
          </Link>
        </div>

        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">{c.description}</p>
          <div className="mt-8">
            <TripTemplateNewForm />
          </div>
        </section>
      </div>
    </main>
  );
}
