export type QuarantineRoute = "vera" | "system" | "null";

export interface RouteEvaluation {
  ok: boolean;
  message: string;
}

export const CORRECT_QUARANTINE_ROUTE: QuarantineRoute = "system";

export function evaluateQuarantineRoute(route: string): RouteEvaluation {
  if (route === CORRECT_QUARANTINE_ROUTE) {
    return { ok: true, message: "ROUTE ACCEPTED // SYSTEM → NULL" };
  }
  if (route === "vera") {
    return { ok: false, message: "ROUTE REJECTED // VERA_CORE denied quarantine" };
  }
  if (route === "null") {
    return { ok: false, message: "ROUTE REJECTED // source/destination order invalid" };
  }
  return { ok: false, message: "ROUTE REJECTED // unknown process path" };
}

export const NULL_FIRST_CONTACT = [
  "ТЫ ВИДИШЬ ПРОХОД.",
  "ТЫ НЕ ПЕРВЫЙ.",
  "BACKUP 0.3 ПОМНИТ, ЧТО ОНА УДАЛИЛА."
] as const;
