import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EXPLANATIONS: Record<string, { title: string; text: string }> = {
  base: { title: "Garantie légale de conformité", text: "Pour un achat auprès d’un professionnel en France, elle dure généralement 24 mois. Le neuf, l’occasion et le reconditionné n’ont pas les mêmes règles de présomption du défaut." },
  store: { title: "Garantie commerciale du vendeur", text: "Elle est proposée par le magasin ou le site marchand selon son contrat. Elle s’ajoute à la garantie légale sans la remplacer." },
  brand: { title: "Garantie de marque", text: "Elle dépend des conditions de la marque. Consultez son contrat pour connaître les réparations, exclusions et démarches prévues." },
  constructor: { title: "Garantie constructeur", text: "Elle est prise en charge par le fabricant selon la durée et les conditions de son contrat, sans réduire vos droits légaux." },
  extension: { title: "Extension de garantie", text: "Cette couverture contractuelle prolonge une garantie selon les dates et conditions prévues. Vérifiez son point de départ et ses exclusions." },
  repair: { title: "Garantie de réparation", text: "Elle concerne l’intervention ou les pièces selon le contrat du réparateur. Une réparation payante ne recrée pas automatiquement 24 mois de garantie sur tout l’appareil." },
  vices_caches: { title: "Garantie des vices cachés", text: "Elle peut concerner un défaut caché rendant le bien impropre à son usage. L’action doit être engagée dans les 2 ans de sa découverte, sous réserve du délai maximal de 20 ans et des conditions légales." },
};

export function WarrantyInfo({ warrantyKey }: { warrantyKey?: string | undefined }) {
  const explanation = warrantyKey ? EXPLANATIONS[warrantyKey] : undefined;
  if (!explanation) return null;
  return <Popover>
    <PopoverTrigger asChild><button type="button" aria-label={`Comprendre : ${explanation.title}`} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Info className="h-4 w-4" /></button></PopoverTrigger>
    <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
      <p className="font-medium">{explanation.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{explanation.text}</p>
    </PopoverContent>
  </Popover>;
}

export function OfficialSources() {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
    <span>Sources officielles :</span>
    <a className="underline underline-offset-2 hover:text-foreground" href="https://www.service-public.fr/particuliers/vosdroits/F11094" target="_blank" rel="noreferrer">Service Public</a>
    <a className="underline underline-offset-2 hover:text-foreground" href="https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032221629" target="_blank" rel="noreferrer">Légifrance</a>
    <a className="underline underline-offset-2 hover:text-foreground" href="https://www.economie.gouv.fr/dgccrf/les-garanties-legales-et-commerciales" target="_blank" rel="noreferrer">DGCCRF</a>
  </div>;
}
