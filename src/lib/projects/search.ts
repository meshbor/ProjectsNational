import { NATIONAL_PROJECTS, type NationalProject, type ProjectGroupId } from "./data";

function stemToken(token: string) {
  return token.replace(
    /(ые|ых|ая|ое|ого|ому|ами|иями|иях|ия|ии|ию|ий|ой|ов|ам|ах|ом|ем|ей|ую|ие|ья|ье|ям|ями)$/u,
    "",
  );
}

export function projectMatchesQuery(project: NationalProject, query: string) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
  if (!tokens.length) return true;

  const haystack = [
    project.title,
    project.goal,
    project.agency,
    project.lead,
    project.curator,
    ...project.federalProjects.map((item) => item.title),
    ...project.highlights,
    ...project.indicators,
    ...project.itHooks,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => {
    if (haystack.includes(token)) return true;
    const stem = stemToken(token);
    return stem.length >= 3 && haystack.includes(stem);
  });
}

export function filterProjects(
  query: string,
  group: ProjectGroupId | "all",
  projects = NATIONAL_PROJECTS,
) {
  return projects.filter((project) => {
    if (group !== "all" && project.group !== group) return false;
    return projectMatchesQuery(project, query);
  });
}
