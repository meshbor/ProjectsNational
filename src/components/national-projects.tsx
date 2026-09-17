"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { usePhoneLayout } from "@/components/mobile-sheet";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  PROJECT_GROUPS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  federalProjectById,
  nationalProjectById,
  type FederalProject,
  type NationalProject,
  type ProjectGroupId,
} from "@/lib/projects/data";
import { budgetFor, formatBillionRub } from "@/lib/projects/budget";
import { projectTree } from "@/lib/projects/tree";
import {
  LARGE_FAMILY_WORKSPACE,
  workspaceFor,
  workspaceForNationalProject,
  type CompanySlot,
  type FederalWorkspace,
  type WorkspaceTask,
} from "@/lib/projects/workspace";

const RAIL_DEFAULT = 320;
const RAIL_MIN = 200;
const RAIL_MAX = 480;
const RAIL_COLLAPSED = 48;

export function NationalProjectsApp() {
  const [selectedNpId, setSelectedNpId] = useState(ACTIVE_NATIONAL_PROJECT_ID);
  const [selectedFpId, setSelectedFpId] = useState(ACTIVE_FEDERAL_PROJECT_ID);
  const [expandedGroups, setExpandedGroups] = useState<Set<ProjectGroupId>>(
    () => new Set(PROJECT_GROUPS.map((group) => group.id)),
  );
  const [expandedNps, setExpandedNps] = useState<Set<string>>(
    () => new Set([ACTIVE_NATIONAL_PROJECT_ID]),
  );
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  const isPhone = usePhoneLayout();

  const tree = useMemo(() => projectTree(), []);
  const selectedProject =
    nationalProjectById(selectedNpId) ?? tree[0]?.projects[0];
  const selectedFp = selectedProject
    ? federalProjectById(selectedProject, selectedFpId) ??
      selectedProject.federalProjects.find((item) => item.status === "ready") ??
      selectedProject.federalProjects[0]
    : undefined;
  const workspace = selectedProject
    ? workspaceFor(selectedProject.id, selectedFp?.id) ??
      workspaceForNationalProject(selectedProject)
    : LARGE_FAMILY_WORKSPACE;
  const columnWidth = railCollapsed ? RAIL_COLLAPSED : railWidth;
  const isFamilyCanvas = workspace.id === LARGE_FAMILY_WORKSPACE.id;

  function openNational(project: NationalProject) {
    const nextFp =
      project.federalProjects.find((item) => item.status === "ready") ??
      project.federalProjects[0];
    setSelectedNpId(project.id);
    setSelectedFpId(nextFp.id);
    setExpandedGroups((current) => new Set(current).add(project.group));
    setExpandedNps((current) => new Set(current).add(project.id));
  }

  function openFederal(project: NationalProject, federal: FederalProject) {
    setSelectedNpId(project.id);
    setSelectedFpId(federal.id);
    setExpandedGroups((current) => new Set(current).add(project.group));
    setExpandedNps((current) => new Set(current).add(project.id));
  }

  function toggleGroup(id: ProjectGroupId) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleNational(id: string) {
    setExpandedNps((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onResizerPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (isPhone) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startWidth: railCollapsed ? RAIL_DEFAULT : railWidth,
    };
    setResizing(true);
    if (railCollapsed) setRailCollapsed(false);
  }

  function onResizerPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current || isPhone) return;
    const next = drag.current.startWidth + (event.clientX - drag.current.startX);
    if (next < 120) {
      setRailCollapsed(true);
      return;
    }
    setRailCollapsed(false);
    setRailWidth(Math.min(RAIL_MAX, Math.max(RAIL_MIN, next)));
  }

  function onResizerPointerUp(event: PointerEvent<HTMLButtonElement>) {
    drag.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onResizerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (isPhone) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setRailCollapsed(false);
      setRailWidth((value) => Math.max(RAIL_MIN, (railCollapsed ? RAIL_DEFAULT : value) - 16));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setRailCollapsed(false);
      setRailWidth((value) => Math.min(RAIL_MAX, (railCollapsed ? RAIL_DEFAULT : value) + 16));
    } else if (event.key === "Home") {
      event.preventDefault();
      setRailCollapsed(false);
      setRailWidth(RAIL_MIN);
    } else if (event.key === "End") {
      event.preventDefault();
      setRailCollapsed(false);
      setRailWidth(RAIL_MAX);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setRailCollapsed((value) => !value);
    }
  }

  return (
    <div className="app-shell">
      <nav className="site-tabs" aria-label="Рабочее место">
        <strong className="site-brand">нацпроекты</strong>
        <p className="site-brand-note">дерево слева · канва в центре</p>
      </nav>

      <div className="section-shell">
        <DigestToolbar
          description={
            isFamilyCanvas
              ? "Сейчас разбираем ФП «Многодетная семья» в нацпроекте «Семья»."
              : `Черновик НП «${selectedProject?.title}». Подрядчиков не выдумываем.`
          }
        />

        <div
          className={[
            "workspace workspace-projects",
            railCollapsed ? "is-rail-collapsed" : "",
            resizing ? "is-resizing" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ "--projects-rail-width": `${columnWidth}px` } as CSSProperties}
        >
          <aside
            className={railCollapsed ? "projects-rail is-collapsed" : "projects-rail"}
            aria-label="Дерево нацпроектов"
          >
            <header className="projects-rail-head">
              <h2>Дерево</h2>
              <button
                type="button"
                className="rail-toggle"
                aria-expanded={!railCollapsed}
                aria-controls="projects-rail-list"
                title={railCollapsed ? "Развернуть дерево" : "Сжать дерево"}
                onClick={() => setRailCollapsed((value) => !value)}
              >
                <span className="visually-hidden">
                  {railCollapsed ? "Развернуть дерево" : "Сжать дерево"}
                </span>
                <span aria-hidden="true">{railCollapsed ? "›" : "‹"}</span>
              </button>
            </header>
            {railCollapsed ? (
              <p className="projects-rail-strip">дерево</p>
            ) : (
              <div id="projects-rail-list" className="projects-rail-list">
                <p className="queue-lead">
                  Группа целей → нацпроект → федеральные проекты. Нажми строку — откроется канва.
                </p>
                <ul className="project-tree">
                  {tree.map((branch) => {
                    const groupOpen = expandedGroups.has(branch.group.id);
                    return (
                      <li key={branch.group.id} className="tree-branch">
                        <button
                          type="button"
                          className="tree-row tree-group"
                          aria-expanded={groupOpen}
                          onClick={() => toggleGroup(branch.group.id)}
                        >
                          <span className="tree-twist" aria-hidden="true">
                            {groupOpen ? "▾" : "▸"}
                          </span>
                          <span className="tree-label">{branch.group.title}</span>
                          <span className="budget-pill">{formatBillionRub(branch.totalBillion)}</span>
                        </button>
                        {groupOpen ? (
                          <ul className="tree-children">
                            {branch.projects.map((project) => {
                              const npOpen = expandedNps.has(project.id);
                              const npActive = project.id === selectedProject?.id;
                              const budget = budgetFor(project.id);
                              return (
                                <li key={project.id}>
                                  <div className="tree-np-line">
                                    <button
                                      type="button"
                                      className="tree-twist-btn"
                                      aria-expanded={npOpen}
                                      aria-label={
                                        npOpen
                                          ? `Свернуть федеральные проекты «${project.title}»`
                                          : `Показать федеральные проекты «${project.title}»`
                                      }
                                      onClick={() => toggleNational(project.id)}
                                    >
                                      {npOpen ? "▾" : "▸"}
                                    </button>
                                    <button
                                      type="button"
                                      className={npActive ? "tree-row tree-np is-active" : "tree-row tree-np"}
                                      onClick={() => openNational(project)}
                                      aria-current={npActive ? "true" : undefined}
                                    >
                                      <span className="tree-label">{project.title}</span>
                                      {project.id === ACTIVE_NATIONAL_PROJECT_ID ? (
                                        <span className="ready-badge">разбираем</span>
                                      ) : (
                                        <span className="todo-badge">в работе</span>
                                      )}
                                      {budget ? (
                                        <span className="budget-pill">
                                          {formatBillionRub(budget.totalBillion)}
                                        </span>
                                      ) : null}
                                    </button>
                                  </div>
                                  {npOpen ? (
                                    <ul className="tree-children tree-fp-list">
                                      {project.federalProjects.map((federal) => {
                                        const fpActive =
                                          npActive && selectedFp?.id === federal.id;
                                        return (
                                          <li key={federal.id}>
                                            <button
                                              type="button"
                                              className={
                                                fpActive
                                                  ? "tree-row tree-fp is-active"
                                                  : "tree-row tree-fp"
                                              }
                                              onClick={() => openFederal(project, federal)}
                                            >
                                              <span className="tree-label">{federal.title}</span>
                                              {federal.status === "ready" ? (
                                                <span className="ready-badge">разбираем</span>
                                              ) : (
                                                <span className="todo-badge">в работе</span>
                                              )}
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>

          <button
            type="button"
            className="rail-resizer"
            aria-label="Ширина дерева"
            aria-orientation="vertical"
            aria-valuemin={RAIL_MIN}
            aria-valuemax={RAIL_MAX}
            aria-valuenow={Math.round(columnWidth)}
            tabIndex={isPhone ? -1 : 0}
            onPointerDown={onResizerPointerDown}
            onPointerMove={onResizerPointerMove}
            onPointerUp={onResizerPointerUp}
            onPointerCancel={onResizerPointerUp}
            onKeyDown={onResizerKeyDown}
          />

          <main className="chat-panel">
            <div className="thread">
              <ActiveWorkspace workspace={workspace} />
            </div>
          </main>

          <aside className="detail keep-on-mobile">
            <section className="maps">
              <h2>Источники</h2>
              {PROJECT_SOURCES.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  <strong>{link.title}</strong>
                  <span>Официальные материалы</span>
                </a>
              ))}
              {RELATED_PROGRAMS.map((item) => (
                <div key={item.title} className="related-note">
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActiveWorkspace({ workspace }: { workspace: FederalWorkspace }) {
  const project = nationalProjectById(workspace.nationalProjectId);
  const budget = project ? budgetFor(project.id) : undefined;
  const isFederal = workspace.id === LARGE_FAMILY_WORKSPACE.id;
  return (
    <section className="selected-card workspace-home">
      <p className="bubble-kicker">{isFederal ? "Рабочее место" : "Черновик рабочего места"}</p>
      <p className="fp-crumb">
        {isFederal
          ? `НП «${project?.title}» → ФП «${workspace.title}»`
          : `НП «${project?.title}»`}
      </p>
      <h2>{workspace.title}</h2>
      <p className="why">{workspace.summary}</p>
      {project ? (
        <dl>
          <div>
            <dt>Бюджет нацпроекта «{project.title}»</dt>
            <dd>
              {budget ? formatBillionRub(budget.totalBillion) : "не опубликован"}
              {budget?.federalBillion != null || budget?.extraBillion ? (
                <span className="budget-split">
                  {budget.federalBillion ? ` ФБ ${formatBillionRub(budget.federalBillion)}` : ""}
                  {budget.extraBillion ? ` · внебюджет ${formatBillionRub(budget.extraBillion)}` : ""}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Куратор / ФОИВ / руководитель</dt>
            <dd>
              {project.curator} · {project.agency} · {project.lead}
            </dd>
          </div>
        </dl>
      ) : null}
      <WorkspaceBody workspace={workspace} />
    </section>
  );
}

function WorkspaceBody({ workspace }: { workspace: FederalWorkspace }) {
  return (
    <>
      <h3>Что уже известно</h3>
      <ul>
        {workspace.knownMeasures.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Компании и исполнители</h3>
      <p className="queue-lead">{workspace.companies.note}</p>
      <ul className="company-list">
        {workspace.companies.slots.map((slot) => (
          <CompanyRow key={slot.role} slot={slot} />
        ))}
      </ul>
      <h3>Задачи</h3>
      <ul className="task-list">
        {workspace.tasks.map((task) => (
          <TaskRow key={task.title} task={task} />
        ))}
      </ul>
    </>
  );
}

function CompanyRow({ slot }: { slot: CompanySlot }) {
  return (
    <li className={slot.name ? "company-slot" : "company-slot is-todo"}>
      <strong>{slot.role}</strong>
      <span>{slot.name ?? "пока пусто"}</span>
      <em>{slot.note}</em>
    </li>
  );
}

function TaskRow({ task }: { task: WorkspaceTask }) {
  return (
    <li className={task.status === "ready" ? "task-row" : "task-row is-todo"}>
      <span className={task.status === "ready" ? "ready-badge" : "todo-badge"}>
        {task.status === "ready" ? "известно" : "в работе"}
      </span>
      <strong>{task.title}</strong>
      <p>{task.detail}</p>
    </li>
  );
}
