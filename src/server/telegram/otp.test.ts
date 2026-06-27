import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma singleton so verifyTelegramOtp can be unit-tested without a DB.
const { db } = vi.hoisted(() => ({
  db: {
    telegramAuthChallenge: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db }));

import { verifyTelegramOtp } from "./otp";

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    nonce: "n1",
    code: "123456",
    telegramUserId: "555",
    telegramChatId: "999",
    username: "rowdy",
    firstName: "Eldiyar",
    attempts: 0,
    consumedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyTelegramOtp", () => {
  it("fails as invalid when the challenge is missing", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(null);
    expect(await verifyTelegramOtp("n1", "123456")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("fails as expired when past expiresAt", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(
      challenge({ expiresAt: new Date(Date.now() - 1000) }),
    );
    expect(await verifyTelegramOtp("n1", "123456")).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("fails as not_sent when no code was delivered yet", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(
      challenge({ code: null, telegramUserId: null }),
    );
    expect(await verifyTelegramOtp("n1", "123456")).toEqual({
      ok: false,
      reason: "not_sent",
    });
  });

  it("fails as too_many after the attempt limit", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(
      challenge({ attempts: 5 }),
    );
    expect(await verifyTelegramOtp("n1", "000000")).toEqual({
      ok: false,
      reason: "too_many",
    });
  });

  it("increments attempts and fails on a wrong code", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(challenge());
    const result = await verifyTelegramOtp("n1", "000000");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(db.telegramAuthChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } }),
    );
  });

  it("returns the existing user on a correct code", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(challenge());
    db.telegramAuthChallenge.update.mockResolvedValue({});
    db.user.findUnique.mockResolvedValue({
      id: "u1",
      status: "ACTIVE",
      telegramUsername: "rowdy",
      email: null,
      name: "Eldiyar",
    });
    db.user.update.mockResolvedValue({ id: "u1", email: null, name: "Eldiyar" });

    const result = await verifyTelegramOtp("n1", "123456");
    expect(result).toEqual({
      ok: true,
      user: { id: "u1", email: null, name: "Eldiyar" },
    });
    // challenge consumed so the code can't be replayed
    expect(db.telegramAuthChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { consumedAt: expect.any(Date) } }),
    );
  });

  it("creates a new user on first sign-in with a correct code", async () => {
    db.telegramAuthChallenge.findUnique.mockResolvedValue(challenge());
    db.telegramAuthChallenge.update.mockResolvedValue({});
    // 1st call: find by telegramUserId → none; 2nd: username-free check → none
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: "u2",
      email: null,
      name: "Eldiyar",
    });

    const result = await verifyTelegramOtp("n1", "123456");
    expect(result).toEqual({
      ok: true,
      user: { id: "u2", email: null, name: "Eldiyar" },
    });
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          telegramUserId: "555",
          telegramUsername: "rowdy",
        }),
      }),
    );
  });
});
