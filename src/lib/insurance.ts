export type InsuranceCoverage = {
  contract_number: string;
  start_date: string;
  end_date: string;
};

export const emptyInsuranceCoverage: InsuranceCoverage = {
  contract_number: "",
  start_date: "",
  end_date: "",
};

/** Lit uniquement l'assurance casse/vol, sans mélanger ses dates avec les garanties. */
export function insuranceCoverageFromDetails(details: unknown): InsuranceCoverage {
  if (!details || typeof details !== "object" || Array.isArray(details)) return { ...emptyInsuranceCoverage };
  const value = (details as Record<string, unknown>)["damage_theft_insurance"];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...emptyInsuranceCoverage };
  const raw = value as Record<string, unknown>;
  return {
    contract_number: typeof raw["contract_number"] === "string" ? raw["contract_number"] : "",
    start_date: typeof raw["start_date"] === "string" ? raw["start_date"] : "",
    end_date: typeof raw["end_date"] === "string" ? raw["end_date"] : "",
  };
}

export function insuranceCoverageError(coverage: InsuranceCoverage): string | null {
  if (coverage.start_date && coverage.end_date && coverage.end_date < coverage.start_date) {
    return "La fin de couverture doit être postérieure ou égale à sa date de début.";
  }
  return null;
}
