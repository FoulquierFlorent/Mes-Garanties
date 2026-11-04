/** Lecture et interprétation d'un justificatif (ticket de caisse, facture, capture d'écran). */

export type ScanFields = {
  name?: string;
  brand?: string;
  store?: string;
  purchase_date?: string;
  order_number?: string;
  order_date?: string;
  category?: string;
};

/** Compare sans accents ni majuscules : l'OCR en perd souvent. */
function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const STORES = [
  "Carrefour", "Leclerc", "E.Leclerc", "Intermarché", "Auchan", "Monoprix", "Boulanger", "Darty",
  "Fnac", "IKEA", "Decathlon", "Leroy Merlin", "Castorama", "Conforama", "BUT", "Amazon", "Cora",
  "Système U", "Hypermarché", "Supermarché", "Magasin",
];

const BRANDS = [
  "Samsung", "Apple", "Sony", "LG", "Bosch", "Siemens", "Dyson", "Miele", "Philips", "Nike",
  "Adidas", "Hoka", "Decathlon", "Rockrider", "Quechua", "Chicco", "Britax", "Lego", "HP", "Canon",
  "Nikon", "NordicTrack", "Garmin", "JBL", "Herman Miller", "Maisons du Monde", "Patagonia",
  "Herschel", "Fossil", "Ray-Ban", "De'Longhi", "Whirlpool", "Panasonic", "Toshiba", "Electrolux",
  "Braun", "Rowenta", "Severin", "Sauter", "Cristal", "Columbia", "Eric Bompard", "Sandro",
];

const CATEGORY_HINTS: Array<[string, string[]]> = [
  ["Électronique", ["smartphone", "telephone", "mobile", "casque", "ecouteur", "ecran", "ordinateur", "portable", "tablette", "televiseur", "television", "tv ", "appareil photo", "enceinte", "montre connectee", "imprimante", "console", "lecteur"]],
  ["Électroménager", ["lave-linge", "lave linge", "lave-vaisselle", "lave vaisselle", "refrigerateur", "congelateur", "aspirateur", "seche-linge", "seche linge", "micro-ondes", "micro ondes", "cafetiere", "machine a cafe", "four ", "plaque", "climatisation", "climatiseur", "fer a repasser", "aspirateur"]],
  ["Meuble", ["canape", "fauteuil", "table", "chaise", "bureau", "lit ", "matelas", "bibliotheque", "armoire", "commode", "meuble", "etagere", "chevet"]],
  ["Sport", ["velo", "velo electrique", "tapis de course", "haltere", "halteres", "rameur", "yoga", "tapis de sol", "raquette", "skateboard", "roller"]],
  ["Enfant", ["poussette", "siege auto", "lit bebe", "chaise haute", "trotinette", "tricycle", "doudou", "lange", "porte-bebe"]],
  ["Jeux", ["jeu de societe", "jeu de cartes", "puzzle", "lego", "playstation", "xbox", "switch", "console", "jouet", "construction", "filde"]],
  ["Accessoires", ["sac a dos", "sac ", "portefeuille", "lunettes", "montre", "parapluie", "ceinture", "etagere cle", "coque"]],
  ["Vêtements", ["veste", "pull", "manteau", "pantalon", "jean", "chaussure", "sneaker", "basket", "t-shirt", "t shirt", "polo", "short", "pyjama", "casquette"]],
  ["Bricolage", ["visseuse", "perceuse", "scie", "marteau", "ponceuse", "poste a souder", "banc de scie", "outillage", "clipso", "peinture", "visserie"]],
];

/** Date française (jj/mm/aaaa) ou ISO (aaaa-mm-jj) cherchée dans le texte. */
function findDate(text: string): string | undefined {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const fr = fold(text).match(/\b(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{4}|\d{2})\b/);
  if (fr) {
    const d = Number(fr[1]);
    const m = Number(fr[2]);
    let y = Number(fr[3]);
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1990 && y <= 2100) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return undefined;
}

/** Ligne qui annonce un numéro : facture, commande, ticket… */
const ORDER_KEYWORD = /facture|commande|ticket|order|invoice|re[çc]episs?/i;
/** Numéro collé derrière son libellé ("n° 004512", "n FA-2025-0187", "ref 45218"). */
const ORDER_LABELED = /\b(?:n[°ºo#]?|num[ée]ro|no|ref[ée]rence|ref)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,24})/i;

/** Une référence contient un chiffre et n'est pas une date. */
function isReference(v: string) {
  return (
    /\d/.test(v) &&
    !/^\d{1,4}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(v) &&
    !/^\d{4}-\d{2}-\d{2}$/.test(v)
  );
}

/** Candidats d'une ligne, du plus fiable au moins fiable. Les montants ("349", "2 499,00") sont écartés. */
function referenceCandidates(line: string): string[] {
  const out: string[] = [];
  const labeled = line.match(ORDER_LABELED);
  if (labeled?.[1]) out.push(labeled[1]);
  for (const raw of line.match(/[A-Za-z0-9][A-Za-z0-9\-\/_.]{2,24}/g) ?? []) {
    const v = raw.replace(/[.\-\/_]+$/, "");
    if (v.length >= 3 && (/[A-Za-z]/.test(v) || /[-\/]/.test(v))) out.push(v);
  }
  return [...new Set(out)].filter(isReference);
}

/** Numéro de facture, de commande ou de ticket repéré sur son libellé, ou juste en dessous. */
export function findOrderNumber(text: string): string | undefined {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!ORDER_KEYWORD.test(lines[i])) continue;
    const found =
      referenceCandidates(lines[i])[0] ??
      (i + 1 < lines.length ? referenceCandidates(lines[i + 1])[0] : undefined);
    if (found) return found;
  }
  return undefined;
}

/** Enlève prix, étoiles et espaces superflus d'une ligne de ticket. */
function cleanLine(line: string) {
  return line
    .replace(/[*#=]/g, " ")
    .replace(/\d[\d\s.,]\s*(eur|euros|€)\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Reconstruit une fiche à partir du texte lu sur le justificatif. */
export function parseReceipt(text: string): ScanFields {
  const out: ScanFields = {};
  if (!text.trim()) return out;
  const folded = fold(text);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 1);

  const date = findDate(text);
  if (date) { out.purchase_date = date; out.order_date = date; }

  const order = findOrderNumber(text);
  if (order) out.order_number = order;

  const store = STORES.find((s) => folded.includes(fold(s)));
  if (store) out.store = store;

  const brand = BRANDS.find((b) => folded.includes(fold(b)));
  if (brand) out.brand = brand;

  const hit = CATEGORY_HINTS.find(([, keys]) => keys.some((k) => folded.includes(k)));
  if (hit) out.category = hit[0];

  const keywords = hit ? hit[1] : [];
  for (const line of lines) {
    const foldedLine = fold(line);
    const looksLikeProduct = keywords.some((k) => foldedLine.includes(k)) || (brand ? foldedLine.includes(fold(brand)) : false);
    if (!looksLikeProduct) continue;
    const cleaned = cleanLine(line);
    if (cleaned.length >= 3 && cleaned.length <= 60) {
      out.name = cleaned;
      break;
    }
  }

  return out;
}

/** Lit le texte d'une image avec l'OCR français, chargée seulement quand on scanne. */
export async function readReceiptText(file: File | Blob, onProgress?: (percent: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}
