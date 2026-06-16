import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { ProfileOnboardingForm } from "./profile-form";

export default async function ProfileOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/profile");
  }

  const onboarding = ruContent.onboarding;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {onboarding.eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {onboarding.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {onboarding.description}
          </p>

          <div className="mt-8 max-w-xl rounded-4xl border border-line bg-white/80 p-6 sm:p-8">
            <ProfileOnboardingForm
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