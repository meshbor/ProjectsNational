import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  federalProjectById,
  nationalProjectById,
  type FederalProject,
  type NationalProject,
  type WorkStatus,
} from "./data";

export type CompanyKind = "agency" | "curator" | "lead" | "region" | "vendor";

export type CompanySlot = {
  kind: CompanyKind;
  role: string;
  name: string | null;
  note: string;
};

export type WorkspaceTask = {
  title: string;
  status: WorkStatus;
  detail: string;
};

export type FederalWorkspace = {
  id: string;
  nationalProjectId: string;
  federalProjectId?: string;
  title: string;
  summary: string;
  knownMeasures: string[];
  companies: {
    note: string;
    slots: CompanySlot[];
  };
  tasks: WorkspaceTask[];
};

/** Единственное разобранное рабочее место. Подрядчиков не выдумываем. */
export const LARGE_FAMILY_WORKSPACE: FederalWorkspace = {
  id: ACTIVE_FEDERAL_PROJECT_ID,
  nationalProjectId: ACTIVE_NATIONAL_PROJECT_ID,
  federalProjectId: ACTIVE_FEDERAL_PROJECT_ID,
  title: "Многодетная семья",
  summary:
    "Федеральный проект внутри нацпроекта «Семья»: поддержка семей с тремя и более детьми. Здесь одно рабочее место — меры, исполнители и задачи. Остальные федеральные и национальные проекты пока в очереди.",
  knownMeasures: [
    "450 тыс. ₽ на погашение ипотеки многодетным; на Дальнем Востоке — до 1 млн ₽",
    "Приоритет многодетных в региональных программах рождаемости и соцконтракте",
    "Цель нацпроекта: больше семей с детьми, в том числе многодетных",
  ],
  companies: {
    note: "Имена подрядчиков и региональных операторов не выдумываем. Появятся после разбора паспорта ФП и закупок.",
    slots: [
      {
        kind: "agency",
        role: "Ответственный ФОИВ",
        name: "Минтруд",
        note: "По паспорту нацпроекта «Семья»",
      },
      {
        kind: "curator",
        role: "Куратор в Правительстве",
        name: "Т. А. Голикова",
        note: "Куратор нацпроекта «Семья»",
      },
      {
        kind: "region",
        role: "Региональные органы и операторы мер",
        name: null,
        note: "TODO: кто в субъекте ведёт статус многодетной семьи и выплаты — из паспорта и региональных актов",
      },
      {
        kind: "vendor",
        role: "Подрядчики и исполнители закупок",
        name: null,
        note: "TODO: выгрузить из ЕИС по ФП, без выдуманных компаний",
      },
    ],
  },
  tasks: [
    {
      title: "Погашение ипотеки многодетным 450 тыс. / 1 млн ₽",
      status: "ready",
      detail: "Мера уже в открытых материалах нацпроекта. Нужны статусы выдачи по регионам — отдельным шагом.",
    },
    {
      title: "Приоритет многодетных в соцконтракте и региональных программах",
      status: "ready",
      detail: "Зафиксировано в обзоре нацпроекта. Не хватает перечня программ по субъектам.",
    },
    {
      title: "Сверить меры с паспортом ФП «Многодетная семья»",
      status: "todo",
      detail: "Отделить это ФП от «Поддержки семьи»: маткапитал, единое пособие и семейная ипотека сюда не переносим, пока не подтвердит паспорт.",
    },
    {
      title: "Карта исполнения по регионам",
      status: "todo",
      detail: "В работе: что уже работает в СПб и Ленобласти, какие органы и сроки.",
    },
    {
      title: "Закупки и подрядчики",
      status: "todo",
      detail: "В работе: объекты и контракты из ЕИС. Компании не заполняем с потолка.",
    },
  ],
};

export function draftWorkspaceFor(project: NationalProject): FederalWorkspace {
  return {
    id: project.id,
    nationalProjectId: project.id,
    title: project.title,
    summary: project.goal,
    knownMeasures: project.highlights,
    companies: {
      note: "Имена подрядчиков и региональных операторов не выдумываем. Появятся после разбора паспорта и закупок.",
      slots: [
        {
          kind: "agency",
          role: "Ответственный ФОИВ",
          name: project.agency,
          note: `По паспорту нацпроекта «${project.title}»`,
        },
        {
          kind: "curator",
          role: "Куратор в Правительстве",
          name: project.curator,
          note: `Куратор нацпроекта «${project.title}»`,
        },
        {
          kind: "lead",
          role: "Руководитель",
          name: project.lead,
          note: "По открытым материалам нацпроекта",
        },
        {
          kind: "vendor",
          role: "Подрядчики и исполнители закупок",
          name: null,
          note: "TODO: выгрузить из ЕИС по ФП, без выдуманных компаний",
        },
      ],
    },
    tasks: [
      {
        title: `Сверить меры с паспортом НП «${project.title}»`,
        status: "todo",
        detail: "Отделить подтверждённые меры от обзора. Компании и контракты не заполняем с потолка.",
      },
      ...project.federalProjects.map((item) => ({
        title: `ФП «${item.title}»`,
        status: item.status,
        detail:
          item.status === "ready"
            ? "Есть разобранная канва — открой этот ФП в дереве или схеме."
            : "В работе: паспорт ФП, меры, закупки и исполнители.",
      })),
    ],
  };
}

export function draftWorkspaceForFederal(
  project: NationalProject,
  federal: FederalProject,
): FederalWorkspace {
  return {
    id: `${project.id}/${federal.id}`,
    nationalProjectId: project.id,
    federalProjectId: federal.id,
    title: federal.title,
    summary: `Федеральный проект внутри НП «${project.title}». Паспорт ещё не разбирали — меры и подрядчиков не выдумываем.`,
    knownMeasures: [
      `Это ФП нацпроекта «${project.title}». Подтверждённые меры появятся после разбора паспорта.`,
    ],
    companies: draftWorkspaceFor(project).companies,
    tasks: [
      {
        title: `Сверить паспорт ФП «${federal.title}»`,
        status: "todo",
        detail: "Отделить подтверждённые меры от обзора. Компании и контракты не заполняем с потолка.",
      },
      {
        title: "Закупки и исполнители",
        status: "todo",
        detail: "В работе: объекты и контракты из ЕИС по этому ФП.",
      },
    ],
  };
}

export function workspaceForNationalProject(project: NationalProject) {
  return draftWorkspaceFor(project);
}

export function workspaceFor(nationalProjectId: string, federalProjectId?: string) {
  const project = nationalProjectById(nationalProjectId);
  if (!project) return null;
  if (!federalProjectId) return draftWorkspaceFor(project);
  if (
    nationalProjectId === LARGE_FAMILY_WORKSPACE.nationalProjectId &&
    federalProjectId === LARGE_FAMILY_WORKSPACE.id
  ) {
    return LARGE_FAMILY_WORKSPACE;
  }
  const federal = federalProjectById(project, federalProjectId);
  return federal ? draftWorkspaceForFederal(project, federal) : draftWorkspaceFor(project);
}
