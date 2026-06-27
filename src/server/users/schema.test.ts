import { describe, expect, it } from "vitest";
import { profileSchema } from "./schema";

describe("profileSchema", () => {
  it("accepts a valid profile and normalizes the phone + @username", () => {
    const result = profileSchema.safeParse({
      name: "Элдияр",
      phone: "+996 555 123456",
      telegramUsername: "@rowdykg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+996555123456");
      expect(result.data.telegramUsername).toBe("rowdykg");
    }
  });

  it("treats a blank telegramUsername as null (now optional)", () => {
    const result = profileSchema.safeParse({
      name: "Элдияр",
      phone: "+996555123456",
      telegramUsername: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telegramUsername).toBeNull();
    }
  });

  it("rejects an invalid phone", () => {
    const result = profileSchema.safeParse({
      name: "Элдияр",
      phone: "555123",
      telegramUsername: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a Cyrillic telegram username", () => {
    const result = profileSchema.safeParse({
      name: "Элдияр",
      phone: "+996555123456",
      telegramUsername: "элдияр",
    });
    expect(result.success).toBe(false);
  });
});
