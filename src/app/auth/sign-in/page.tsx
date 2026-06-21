import Link from "next/link";
import { redirect } from "next/navigation";
import {
  devLoginEnabled,
  getCurrentUser,
  getPostAuthRedirect,
  googleConfigured,
} from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { GoogleButton } from "./google-button";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getPostAuthRedirect(user));
  }

  const { signIn } = ruContent.auth;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="mb-6">
          <Link href="/" className="text-sm font-medium text-accent hover:text-accent-strong">
            {signIn.homeLink}
          </Link>
        </div>

        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {signIn.eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {signIn.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {signIn.description}
          </p>

          <div className="mt-8 max-w-xl space-y-5 rounded-4xl border border-line bg-white/80 p-6 sm:p-8">
            {googleConfigured && <GoogleButton />}

            {!googleConfigured && !devLoginEnabled && (
              <p className="text-sm text-muted">{signIn.noProviders}</p>
            )}

            {devLoginEnabled && (
              <div className={googleConfigured ? "border-t border-line pt-5" : ""}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {signIn.devLoginTitle}
                </p>
                <SignInForm />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}