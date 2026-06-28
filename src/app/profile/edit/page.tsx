import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfileEditPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/profile/edit");
  }

  const c = ruContent.profileEdit;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {c.back}
          </Link>
        </div>

        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            {c.description}
          </p>

          <div className="mt-8">
            <ProfileEditForm
              defaultValues={{
                name: user.name,
                phone: user.phone ?? "",
                telegramUsername: user.telegramUsername ?? "",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
