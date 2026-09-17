import { NATIONAL_PROJECTS, PROJECT_GROUPS, type NationalProject } from "./data";
import { budgetTotal, projectsByBudgetDesc } from "./budget";

export type ProjectTreeBranch = {
  group: (typeof PROJECT_GROUPS)[number];
  projects: NationalProject[];
  totalBillion: number;
};

/** Группа целей → нацпроекты (по бюджету внутри группы) → у каждого НП свои ФП. */
export function projectTree(projects = NATIONAL_PROJECTS): ProjectTreeBranch[] {
  return PROJECT_GROUPS.map((group) => {
    const inGroup = projectsByBudgetDesc(projects.filter((project) => project.group === group.id));
    return {
      group,
      projects: inGroup,
      totalBillion: inGroup.reduce((sum, project) => sum + budgetTotal(project.id), 0),
    };
  }).filter((branch) => branch.projects.length > 0);
}
