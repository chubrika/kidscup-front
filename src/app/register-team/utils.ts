import { format, isValid, parseISO } from "date-fns";

export const PLAYER_POSITIONS = [
  { code: "PG", label: "გამთამაშებელი" },
  { code: "SG", label: "მსროლელი" },
  { code: "SF", label: "მსუბუქი ფორვარდი" },
  { code: "PF", label: "მძიმე ფორვარდი" },
  { code: "C", label: "ცენტრი" },
] as const;

export function getPositionLabel(code?: string): string {
  if (!code) return "—";
  const match = PLAYER_POSITIONS.find((item) => item.code === code);
  return match ? `${match.code} - ${match.label}` : code;
}

export function formatBirthDateDisplay(birthDate?: string): string {
  if (!birthDate) return "—";
  const parsed = parseISO(birthDate.includes("T") ? birthDate : `${birthDate}T12:00:00`);
  if (!isValid(parsed)) return "—";
  return format(parsed, "dd.MM.yyyy");
}

export function toBirthDateInputValue(birthDate?: string): string {
  if (!birthDate) return "";
  const parsed = parseISO(birthDate.includes("T") ? birthDate : `${birthDate}T12:00:00`);
  if (!isValid(parsed)) return "";
  return format(parsed, "yyyy-MM-dd");
}
