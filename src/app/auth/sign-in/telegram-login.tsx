"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ruContent } from "@/lib/content/ru";
import { startTelegramLoginAction } from "./telegram-actions";

export function TelegramLogin() {
  const searchParams = useSearchParams();
  const t = ruContent.auth.telegram;
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [phase, setPhase] = useState<"idle" | "code">("idle");
  const [nonce, setNonce] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const result = await startTelegramLoginAction();
      if (!result.ok) {
        setError(t.errors.start);
        return;
      }
      setNonce(result.nonce);
      setDeepLink(result.deepLink);
      setPhase("code");
      // Open the bot so it can deliver the code; the user returns here to enter it.
      window.open(result.deepLink, "_blank", "noopener,noreferrer");
    } catch {
      setError(t.errors.start);
    } finally {
      setStarting(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nonce) return;
    setVerifying(true);
    setError(null);
    try {
      const result = await signIn("telegram-otp", {
        nonce,
        code: code.trim(),
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(t.errors.invalid);
        return;
      }
      window.location.href = result?.url ?? callbackUrl;
    } catch {
      setError(t.errors.generic);
    } finally {
      setVerifying(false);
    }
  }

  if (phase === "idle") {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {starting ? t.starting : t.cta}
        </button>
        <p className="text-sm leading-6 text-muted">{t.step1}</p>
        {error ? (
          <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{t.step2}</p>

      {deepLink ? (
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-medium text-accent hover:text-accent-strong"
        >
          {t.reopen}
        </a>
      ) : null}

      <form className="space-y-3" onSubmit={handleVerify}>
        <label className="text-sm font-medium text-foreground" htmlFor="tg-code">
          {t.codeLabel}
        </label>
        <input
          id="tg-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder={t.codePlaceholder}
          required
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground outline-none transition placeholder:text-muted placeholder:tracking-normal focus:border-accent"
        />

        {error ? (
          <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={verifying || code.length < 6}
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {verifying ? t.pending : t.verify}
        </button>
      </form>
    </div>
  );
}
