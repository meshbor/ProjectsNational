import { NATIONAL_PROJECTS } from "./data";

export type ProjectBudget = {
  totalBillion: number;
  federalBillion?: number;
  extraBillion?: number;
  source: string;
};

/** Общий контур 2025–2030: федеральный бюджет + внебюджет, если не указано иное. */
const GOV_MARCH_2025 =
  "2025–2030, презентация Правительства к отчёту в Госдуме, март 2025";

export const PROJECT_BUDGETS: Record<string, ProjectBudget> = {
  family: { totalBillion: 17890, federalBillion: 17890, extraBillion: 0, source: GOV_MARCH_2025 },
  infra: { totalBillion: 10852, federalBillion: 9697, extraBillion: 1155, source: GOV_MARCH_2025 },
  "transport-system": {
    totalBillion: 7846,
    federalBillion: 1015,
    extraBillion: 6831,
    source: GOV_MARCH_2025,
  },
  youth: { totalBillion: 3700, federalBillion: 3534, extraBillion: 166, source: GOV_MARCH_2025 },
  economy: { totalBillion: 2731, federalBillion: 709, extraBillion: 2023, source: GOV_MARCH_2025 },
  "long-life": { totalBillion: 2025, federalBillion: 2025, extraBillion: 0, source: GOV_MARCH_2025 },
  "mobility-industry": {
    totalBillion: 1879,
    federalBillion: 1489,
    extraBillion: 391,
    source: GOV_MARCH_2025,
  },
  data: { totalBillion: 1435, federalBillion: 1015, extraBillion: 420, source: GOV_MARCH_2025 },
  atom: { totalBillion: 1251, federalBillion: 277, extraBillion: 974, source: GOV_MARCH_2025 },
  eco: { totalBillion: 1207, federalBillion: 811, extraBillion: 396, source: GOV_MARCH_2025 },
  export: { totalBillion: 643, federalBillion: 643, extraBillion: 0, source: GOV_MARCH_2025 },
  tourism: { totalBillion: 623, federalBillion: 460, extraBillion: 163, source: GOV_MARCH_2025 },
  machines: { totalBillion: 491, federalBillion: 491, extraBillion: 0, source: GOV_MARCH_2025 },
  bas: { totalBillion: 290, federalBillion: 250, extraBillion: 40, source: GOV_MARCH_2025 },
  food: { totalBillion: 258, federalBillion: 127, extraBillion: 131, source: GOV_MARCH_2025 },
  materials: { totalBillion: 170, federalBillion: 170, extraBillion: 1, source: GOV_MARCH_2025 },
  workforce: { totalBillion: 113, federalBillion: 113, extraBillion: 0, source: GOV_MARCH_2025 },
  "health-tech": { totalBillion: 38, federalBillion: 38, extraBillion: 0, source: GOV_MARCH_2025 },
  space: {
    totalBillion: 2190.6,
    federalBillion: 1700,
    extraBillion: 490.6,
    source: "До 2030, презентация Роскосмоса (Коммерсантъ, июнь 2025)",
  },
  bioeconomy: {
    totalBillion: 20,
    federalBillion: 20,
    extraBillion: 0,
    source: "До 2030, оценка Минпромторга (Интерфакс)",
  },
};

export const BUDGET_NOTE =
  "Общий бюджет за 2025–2030 годы: федеральные средства и внебюджет, где они заложены в паспорте. Цифры округлены и могут уточняться в законе о бюджете.";

export function formatBillionRub(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} трлн ₽`;
  }
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млрд ₽`;
}

export function budgetFor(projectId: string) {
  return PROJECT_BUDGETS[projectId];
}

export function everyProjectHasBudget() {
  return NATIONAL_PROJECTS.every((project) => Boolean(PROJECT_BUDGETS[project.id]));
}
