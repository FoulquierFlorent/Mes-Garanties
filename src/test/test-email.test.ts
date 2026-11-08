import { beforeEach, expect, it, vi } from "vitest";

const { send, getUser } = vi.hoisted(() => ({ send: vi.fn(), getUser: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/email-templates/send-email", () => ({ sendTemplateEmail: send }));

import { sendAccountTestEmail } from "@/lib/test-email.functions";

const invoke = sendAccountTestEmail as unknown as (input: { context: { userId: string; supabase: { auth: { getUser: typeof getUser } } } }) => Promise<{ sent: boolean }>;
const run = () => invoke({ context: { userId: "account-owner", supabase: { auth: { getUser } } } });

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "account-owner", email: "owner@example.com", email_confirmed_at: "2026-11-08" } }, error: null });
  send.mockResolvedValue({ sent: true });
});

it("sends the fixed test template only to the verified account address", async () => {
  expect(await run()).toMatchObject({ sent: true });
  expect(send).toHaveBeenCalledExactlyOnceWith("test-email", "owner@example.com", { idempotencyKey: expect.stringMatching(/^test-email-account-owner-\d+$/) });
});

it("does not send for a different or unverified account", async () => {
  for (const user of [null, { id: "someone-else", email: "other@example.com", email_confirmed_at: "2026-11-08" }, { id: "account-owner", email: "owner@example.com" }]) {
    getUser.mockResolvedValue({ data: { user }, error: null });
    expect(await run()).toMatchObject({ sent: false });
  }
  expect(send).not.toHaveBeenCalled();
});

it("respects suppression without retrying", async () => {
  send.mockResolvedValue({ sent: false, reason: "recipient_suppressed" });
  expect(await run()).toMatchObject({ sent: false });
  expect(send).toHaveBeenCalledTimes(1);
});