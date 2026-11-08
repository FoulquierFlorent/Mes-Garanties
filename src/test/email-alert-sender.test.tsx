import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { email_alert_lead: "1m" }, error: null }) }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }),
}));

import { EmailAlertPreferences } from "@/components/EmailAlertPreferences";
import { SENDER_EMAIL } from "@/lib/email-sender";

describe("adresse d'envoi affichée dans les alertes e-mail", () => {
  afterEach(cleanup);

  it("l'adresse d'envoi est celle du domaine vérifié", () => {
    expect(SENDER_EMAIL).toBe("noreply@mesgaranties.com");
  });

  it("la section des alertes indique l'adresse d'envoi", () => {
    render(<EmailAlertPreferences householdId="h1" userId="u1" />);
    expect(screen.getByText("noreply@mesgaranties.com")).toBeTruthy();
  });
});
