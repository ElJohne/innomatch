import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/server/auth/session", () => ({ session: vi.fn() }));
import { session } from "@/server/auth/session";
import { actor, authenticateStaff, requireStaff } from "@/server/auth/staff";
import { hashPassword } from "@/server/auth/password";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
describe("staff authorization", () => {
  it("requires configured credentials and revalidates role/version on every request", async () => {
    vi.stubEnv("DATA_PROVIDER", "fixtures");
    vi.stubEnv("DEMO_DATA_ENABLED", "true");
    vi.stubEnv("DEMO_STAFF_LOGIN", "staff@example.test");
    vi.stubEnv(
      "DEMO_STAFF_PASSWORD_HASH",
      await hashPassword("synthetic-staff-password"),
    );
    expect(
      await authenticateStaff("other@example.test", "synthetic-staff-password"),
    ).toBeNull();
    const staff = await authenticateStaff(
      "staff@example.test",
      "synthetic-staff-password",
    );
    expect(staff).not.toBeNull();
    const cookie = {
      ownerId: "guest",
      staffId: staff!.id,
      authVersion: staff!.authVersion,
      staffExpiresAt: Date.now() + 3600000,
    } as Awaited<ReturnType<typeof session>>;
    vi.mocked(session).mockResolvedValue(cookie);
    expect((await requireStaff(true)).staff?.role).toBe("ADMIN");
    cookie.authVersion = 999;
    expect((await actor()).staff).toBeUndefined();
    await expect(requireStaff()).rejects.toMatchObject({ status: 403 });
    cookie.authVersion = staff!.authVersion;
    vi.stubEnv(
      "DEMO_STAFF_PASSWORD_HASH",
      await hashPassword("replacement-staff-password"),
    );
    expect((await actor()).staff).toBeUndefined();
    await expect(requireStaff()).rejects.toMatchObject({ status: 403 });
  });
  it("does not invent a demo administrator when configuration is absent", async () => {
    vi.stubEnv("DATA_PROVIDER", "fixtures");
    vi.stubEnv("DEMO_DATA_ENABLED", "true");
    vi.stubEnv("DEMO_STAFF_LOGIN", "");
    vi.stubEnv("DEMO_STAFF_PASSWORD_HASH", "");
    expect(
      await authenticateStaff("admin@example.test", "anything"),
    ).toBeNull();
    vi.mocked(session).mockResolvedValue(
      {} as Awaited<ReturnType<typeof session>>,
    );
    await expect(requireStaff()).rejects.toMatchObject({ status: 403 });
  });
});
