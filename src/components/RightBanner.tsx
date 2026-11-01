import { useEffect, useState } from "react";
import { Pointer } from "lucide-react";
import { WARRANTY_PHRASES, daySeed, phraseOfDay } from "@/lib/phrases";
import { cn } from "@/lib/utils";

type Props = {
  /** Décale la phrase choisie : chaque emplacement affiche une phrase différente. */
  offset?: number;
  /** Impose une phrase précise (sinon la phrase tourne chaque jour). */
  text?: string;
  variant?: "strip" | "whisper";
  className?: string;
};

/**
 * Bandeau d'information (strip) ou petite écriture (whisper) rappelant
 * que les garanties sont un droit. Ton informatif, décontracté.
 */
export function RightBanner({ offset = 0, text, variant = "strip", className }: Props) {
  const [phrase, setPhrase] = useState(text ?? WARRANTY_PHRASES[offset % WARRANTY_PHRASES.length] ?? "");

  useEffect(() => {
    if (!text) setPhrase(phraseOfDay(daySeed(), offset));
  }, [offset, text]);

  if (variant === "whisper") {
    return (
      <p className={cn("flex items-start justify-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Pointer className="mt-0.5 h-3 w-3 shrink-0 -rotate-12 text-accent" aria-hidden />
        <span>{phrase}</span>
      </p>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-lg bg-banner px-4 py-3 text-sm leading-relaxed text-banner-foreground",
        className,
      )}
    >
      <Pointer className="mt-0.5 h-4 w-4 shrink-0 -rotate-12 text-accent" aria-hidden />
      <span>{phrase}</span>
    </p>
  );
}
