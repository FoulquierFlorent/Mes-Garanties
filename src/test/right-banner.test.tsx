import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RightBanner } from "@/components/RightBanner";
import { WARRANTY_PHRASES, daySeed, phraseOfDay } from "@/lib/phrases";

describe("phrases rappelant que les garanties sont un droit", () => {
  it("la liste contient la phrase sur la garantie légale de 2 ans", () => {
    expect(WARRANTY_PHRASES).toContain(
      "La garantie légale de conformité couvre vos achats pendant 2 ans : réparation ou remplacement gratuit.",
    );
  });

  it("la phrase du jour change chaque jour et reste dans la liste", () => {
    expect(phraseOfDay(0, 0)).not.toBe(phraseOfDay(1, 0));
    expect(WARRANTY_PHRASES).toContain(phraseOfDay(0, 0));
    expect(WARRANTY_PHRASES).toContain(phraseOfDay(-1, 3));
    expect(daySeed(new Date("2026-01-02T00:00:00Z")) - daySeed(new Date("2026-01-01T00:00:00Z"))).toBe(1);
  });

  it("la mini banderole affiche une phrase de la liste", () => {
    const { container } = render(<RightBanner offset={0} />);
    expect(WARRANTY_PHRASES).toContain(container.textContent);
  });

  it("la petite écriture affiche une phrase de la liste", () => {
    const { container } = render(<RightBanner variant="whisper" offset={1} />);
    expect(WARRANTY_PHRASES).toContain(container.textContent);
  });

  it("une phrase imposée est affichée telle quelle", () => {
    const { container } = render(<RightBanner text="La garantie légale de conformité est un droit, pas une faveur." />);
    expect(container.textContent).toBe("La garantie légale de conformité est un droit, pas une faveur.");
  });
});
