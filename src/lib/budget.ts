export type BudgetTemperature = "Quente" | "Frio";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isValidDateOnly(dateValue: unknown): dateValue is string {
  if (typeof dateValue !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
}

function toLocalDate(dateValue: string): Date {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateValue);
}

export function getDaysSinceConsultation(dateValue: string): number {
  const consultationDate = toLocalDate(dateValue);

  if (Number.isNaN(consultationDate.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  consultationDate.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - consultationDate.getTime()) / DAY_IN_MS)
  );
}

export function getBudgetTemperature(dateValue: string): BudgetTemperature {
  return getDaysSinceConsultation(dateValue) <= 3 ? "Quente" : "Frio";
}

export function comparePatientNames(
  first: { patients: { name: string } | null },
  second: { patients: { name: string } | null }
): number {
  return (first.patients?.name || "").localeCompare(
    second.patients?.name || "",
    "pt-BR",
    { sensitivity: "base" }
  );
}
