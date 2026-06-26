import { UserStatus, type User } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyTelegramOtp } from "@/server/telegram/otp";
import { buildDisplayName, isUserProfileComplete } from "@/server/users/profile";

const TELEGRAM_PROVIDER_ID = "telegram-otp";

const signInSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(80).optional(),
});

/** Production target: Google sign-in. Available once the OAuth client is set. */
export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/** Dev-only email login kept for local testing; disabled in production. */
export const devLoginEnabled = process.env.NODE_ENV !== "production";

/** Telegram OTP sign-in, available once the bot token + username are configured. */
export const telegramConfigured = Boolean(
  process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME,
);

const credentialsProvider = CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    name: { label: "Имя", type: "text" },
  },
  async authorize(credentials) {
    const parsed = signInSchema.safeParse(credentials);
    if (!parsed.success) {
      return null;
    }

    const email = parsed.data.email.toLowerCase();
    const providedName = parsed.data.name?.trim();

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.status !== UserStatus.ACTIVE) {
        return null;
      }

      const updatedUser =
        providedName && providedName !== existingUser.name
          ? await db.user.update({
              where: { id: existingUser.id },
              data: { name: providedName },
            })
          : existingUser;

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      };
    }

    const createdUser = await db.user.create({
      data: { email, name: providedName || buildDisplayName(email) },
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    };
  },
});

// Telegram OTP: identity is verified end-to-end in verifyTelegramOtp (challenge +
// code), so authorize just maps a valid challenge to our DB user. The returned id
// is already our User.id, which the jwt callback trusts directly (no email needed).
const telegramProvider = CredentialsProvider({
  id: TELEGRAM_PROVIDER_ID,
  name: "Telegram",
  credentials: {
    nonce: { label: "Nonce", type: "text" },
    code: { label: "Code", type: "text" },
  },
  async authorize(credentials) {
    const nonce = credentials?.nonce?.trim();
    const code = credentials?.code?.trim();
    if (!nonce || !code) return null;

    const result = await verifyTelegramOtp(nonce, code);
    if (!result.ok) return null;

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
  },
});

const providers: NextAuthOptions["providers"] = [];
if (googleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}
if (telegramConfigured) {
  providers.push(telegramProvider);
}
if (devLoginEnabled) {
  providers.push(credentialsProvider);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers,
  callbacks: {
    // Block blocked/suspended users at the door. Telegram OTP already resolves +
    // status-checks the user inside verifyTelegramOtp, so it's allowed through.
    async signIn({ user, account }) {
      if (account?.provider === TELEGRAM_PROVIDER_ID) return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await db.user.findUnique({
        where: { email },
        select: { status: true },
      });
      return !existing || existing.status === UserStatus.ACTIVE;
    },
    // Resolve our DB user id so every provider maps onto the same User row. Runs
    // only on initial sign-in. Telegram OTP already returns our User.id (no email),
    // so we trust it directly; email providers find-or-create by email.
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === TELEGRAM_PROVIDER_ID) {
          token.userId = user.id;
        } else if (user.email) {
          const email = user.email.toLowerCase();
          const dbUser = await db.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              name: user.name?.trim() || buildDisplayName(email),
              avatarUrl: user.image ?? null,
            },
          });
          token.userId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return null;
  }

  return db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      telegramUsername: true,
      telegramChatId: true,
      role: true,
      status: true,
      driverProfile: {
        select: {
          id: true,
          bio: true,
        },
      },
      vehicles: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          id: true,
          make: true,
          model: true,
          color: true,
          plateNumber: true,
          seatsCount: true,
        },
      },
      createdAt: true,
    },
  });
}

export function getPostAuthRedirect(
  user: Pick<User, "phone" | "telegramUsername">,
) {
  return isUserProfileComplete(user) ? "/dashboard" : "/onboarding/profile";
}