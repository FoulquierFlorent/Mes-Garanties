import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
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
 * Mini banderole (strip) ou petite écriture (whisper) rappelant que
 * les garanties sont un droit.
 */
export function RightBanner({ offset = 0, text, variant = "strip", className }: Props) {
  const [phrase, setPhrase] = useState(text ?? WARRANTY_PHRASES[offset % WARRANTY_PHRASES.length] ?? "");

  useEffect(() => {
    if (!text) setPhrase(phraseOfDay(daySeed(), offset));
  }, [offset, text]);

  if (variant === "whisper") {
    return <p className={cn("text-xs italic text-muted-foreground", className)}>{phrase}</p>;
  }

  return (
    <p className={cn("flex items-center gap-2 rounded-md border border-accent/25 bg-accent/5 px-3 py-2 text-xs text-foreground/80", className)}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      <span>{phrase}</span>
    </p>
  );
}
