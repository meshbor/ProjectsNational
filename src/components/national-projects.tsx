"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { GlossaryHint } from "@/components/glossary-hint";
import { usePhoneLayout } from "@/components/mobile-sheet";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  NATIONAL_PROJECTS,
  PROJECT_GROUPS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  federalProjectById,
  nationalProjectById,
  type FederalProject,
  type NationalProject,
  type ProjectGroupId,
} from "@/lib/projects/data";
import { budgetFor, formatBillionRub, projectsByBudgetDesc } from "@/lib/projects/budget";
import {
  RAIL_COLLAPSED,
  RAIL_DEFAULT,
  RAIL_MIN,
  clampRailWidth,
  railMaxForWorkspace,
  railViewCaption,
  twoThirdsRailWidth,
  type RailView,
} from "@/lib/projects/rail";
import { projectTree } from "@/lib/projects/tree";
import {
  LARGE_FAMILY_WORKSPACE,
  workspaceFor,
  workspaceForNationalProject,
  type CompanyKind,
  type CompanySlot,
  type FederalWorkspace,
  type WorkspaceTask,
} from "@/lib/projects/workspace";

export function NationalProjectsApp() {
  const [selectedNpId, setSelectedNpId] = useState(ACTIVE_NATIONAL_PROJECT_ID);
  const [selectedFpId, setSelectedFpId] = useState(ACTIVE_FEDERAL_PROJECT_ID);
  const [railView, setRailView] = useState<RailView>("list");
  const [expandedGroups, setExpandedGroups] = useState<Set<ProjectGroupId>>(
    () => new Set(PROJECT_GROUPS.map((group) => group.id)),
  );
  const [expandedNps, setExpandedNps] = useState<Set<string>>(
    () => new Set([ACTIVE_NATIONAL_PROJECT_ID]),
  );
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const isPhone = usePhoneLayout();

  const ranked = useMemo(() => projectsByBudgetDesc(NATIONAL_PROJECTS), []);
  const tree = useMemo(() => projectTree(), []);
  const selectedProject =
    nationalProjectById(selectedNpId) ?? ranked[0] ?? tree[0]?.projects[0];
  const selectedFp = selectedProject
    ? federalProjectById(selectedProject, selectedFpId) ??
      selectedProject.federalProjects.find((item) => item.status === "ready") ??
      selectedProject.federalProjects[0]
    : undefined;
  const workspace = selectedProject
    ? workspaceFor(selectedProject.id, selectedFp?.id) ??
      workspaceForNationalProject(selectedProject)
    : LARGE_FAMILY_WORKSPACE;
  const railMax = railMaxForWorkspace(workspaceWidth);
  const columnWidth = railCollapsed ? RAIL_COLLAPSED : railWidth;
  const isFamilyCanvas = workspace.id === LARGE_FAMILY_WORKSPACE.id;
  const isRailWide = !railCollapsed && railWidth >= workspaceWidth * 0.5 && workspaceWidth > 0;

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const apply = () => setWorkspaceWidth(el.clientWidth);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (workspaceWidth <= 0) return;
    const max = railMaxForWorkspace(workspaceWidth);
    setRailWidth((value) => clampRailWidth(value, max));
  }, [workspaceWidth]);

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

  function applyRailWidth(next: number) {
    setRailCollapsed(false);
    setRailWidth(clampRailWidth(next, railMax));
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
    setRailWidth(clampRailWidth(next, railMax));
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
      applyRailWidth((railCollapsed ? RAIL_DEFAULT : railWidth) - 16);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      applyRailWidth((railCollapsed ? RAIL_DEFAULT : railWidth) + 16);
    } else if (event.key === "Home") {
      event.preventDefault();
      applyRailWidth(RAIL_MIN);
    } else if (event.key === "End") {
      event.preventDefault();
      applyRailWidth(twoThirdsRailWidth(workspaceWidth));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setRailCollapsed((value) => !value);
    }
  }

  return (
    <div className="app-shell">
      <nav className="site-tabs" aria-label="Рабочее место">
        <div className="site-brand-cluster">
          <strong className="site-brand">нацпроекты</strong>
          <GlossaryHint />
        </div>
        <p className="site-brand-note">каталог слева · канва в центре</p>
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
          ref={workspaceRef}
          className={[
            "workspace workspace-projects",
            railCollapsed ? "is-rail-collapsed" : "",
            resizing ? "is-resizing" : "",
            isRailWide ? "is-rail-wide" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ "--projects-rail-width": `${columnWidth}px` } as CSSProperties}
        >
          <aside
            className={railCollapsed ? "projects-rail is-collapsed" : "projects-rail"}
            aria-label="Нацпроекты"
          >
            <header className="projects-rail-head">
              <div className="projects-rail-head-row">
                <h2>Нацпроекты</h2>
                <div className="rail-tools">
                  <button
                    type="button"
                    className="rail-toggle"
                    aria-expanded={!railCollapsed}
                    aria-controls="projects-rail-list"
                    title={railCollapsed ? "Развернуть колонку" : "Сжать колонку"}
                    onClick={() => setRailCollapsed((value) => !value)}
                  >
                    <span className="visually-hidden">
                      {railCollapsed ? "Развернуть колонку" : "Сжать колонку"}
                    </span>
                    <span aria-hidden="true">{railCollapsed ? "›" : "‹"}</span>
                  </button>
                </div>
              </div>
              {railCollapsed ? null : (
                <div className="rail-view" role="group" aria-label="Вид каталога">
                  <button
                    type="button"
                    className={railView === "list" ? "is-active" : undefined}
                    aria-pressed={railView === "list"}
                    title="Список"
                    onClick={() => setRailView("list")}
                  >
                    <ListViewIcon />
                    Список
                  </button>
                  <button
                    type="button"
                    className={railView === "tree" ? "is-active" : undefined}
                    aria-pressed={railView === "tree"}
                    title="Дерево"
                    onClick={() => setRailView("tree")}
                  >
                    <TreeViewIcon />
                    Дерево
                  </button>
                  <button
                    type="button"
                    className={railView === "scheme" ? "is-active" : undefined}
                    aria-pressed={railView === "scheme"}
                    title="Схема"
                    onClick={() => setRailView("scheme")}
                  >
                    <SchemeViewIcon />
                    Схема
                  </button>
                </div>
              )}
            </header>
            {railCollapsed ? (
              <p className="projects-rail-strip">{railViewCaption(railView)}</p>
            ) : (
              <div
                id="projects-rail-list"
                className={railView === "scheme" ? "projects-rail-list is-scheme" : "projects-rail-list"}
              >
                {railView === "list" ? (
                  <RailList
                    ranked={ranked}
                    selectedId={selectedProject?.id}
                    onOpen={openNational}
                  />
                ) : railView === "tree" ? (
                  <RailTree
                    tree={tree}
                    selectedNpId={selectedProject?.id}
                    selectedFpId={selectedFp?.id}
                    expandedGroups={expandedGroups}
                    expandedNps={expandedNps}
                    onToggleGroup={toggleGroup}
                    onToggleNational={toggleNational}
                    onOpenNational={openNational}
                    onOpenFederal={openFederal}
                  />
                ) : (
                  <RailScheme
                    tree={tree}
                    selectedNpId={selectedProject?.id}
                    selectedFpId={selectedFp?.id}
                    expandedGroups={expandedGroups}
                    onToggleGroup={toggleGroup}
                    onOpenNational={openNational}
                    onOpenFederal={openFederal}
                  />
                )}
              </div>
            )}
          </aside>

          <button
            type="button"
            className="rail-resizer"
            aria-label="Ширина колонки нацпроектов"
            aria-orientation="vertical"
            aria-valuemin={RAIL_MIN}
            aria-valuemax={Math.round(railMax)}
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

function ListViewIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="2" width="12" height="3" rx="0.8" />
      <rect x="2" y="6.5" width="12" height="3" rx="0.8" />
      <rect x="2" y="11" width="12" height="3" rx="0.8" />
    </svg>
  );
}

function TreeViewIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="1.5" width="11" height="3" rx="0.7" />
      <rect x="6" y="6.5" width="8" height="3" rx="0.7" />
      <rect x="6" y="11.5" width="8" height="3" rx="0.7" />
      <path d="M4.2 3v10" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function SchemeViewIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5" y="1" width="6" height="3.6" rx="0.7" />
      <path
        d="M8 4.6v2M2.4 6.6h11.2M2.4 6.6V9M8 6.6V9M13.6 6.6V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect x="0.5" y="9" width="4.2" height="5" rx="0.7" />
      <rect x="5.9" y="9" width="4.2" height="5" rx="0.7" />
      <rect x="11.3" y="9" width="4.2" height="5" rx="0.7" />
    </svg>
  );
}

function RailList({
  ranked,
  selectedId,
  onOpen,
}: {
  ranked: NationalProject[];
  selectedId?: string;
  onOpen: (project: NationalProject) => void;
}) {
  return (
    <>
      <p className="queue-lead">По убыванию бюджета, 2025–2030.</p>
      {ranked.map((project) => {
        const budget = budgetFor(project.id);
        const active = project.id === selectedId;
        return (
          <button
            key={project.id}
            type="button"
            className={active ? "rail-project is-active" : "rail-project"}
            onClick={() => onOpen(project)}
            aria-current={active ? "true" : undefined}
          >
            <span className="rail-project-top">
              {project.id === ACTIVE_NATIONAL_PROJECT_ID ? (
                <span className="ready-badge">разбираем</span>
              ) : (
                <span className="todo-badge">в работе</span>
              )}
              {budget ? (
                <span className="budget-pill">{formatBillionRub(budget.totalBillion)}</span>
              ) : null}
            </span>
            <strong>{project.title}</strong>
          </button>
        );
      })}
    </>
  );
}

function RailTree({
  tree,
  selectedNpId,
  selectedFpId,
  expandedGroups,
  expandedNps,
  onToggleGroup,
  onToggleNational,
  onOpenNational,
  onOpenFederal,
}: {
  tree: ReturnType<typeof projectTree>;
  selectedNpId?: string;
  selectedFpId?: string;
  expandedGroups: Set<ProjectGroupId>;
  expandedNps: Set<string>;
  onToggleGroup: (id: ProjectGroupId) => void;
  onToggleNational: (id: string) => void;
  onOpenNational: (project: NationalProject) => void;
  onOpenFederal: (project: NationalProject, federal: FederalProject) => void;
}) {
  return (
    <>
      <p className="queue-lead">Группа целей → нацпроект → федеральные проекты.</p>
      <ul className="project-tree">
        {tree.map((branch) => {
          const groupOpen = expandedGroups.has(branch.group.id);
          return (
            <li key={branch.group.id} className="tree-branch">
              <button
                type="button"
                className="tree-row tree-group"
                aria-expanded={groupOpen}
                onClick={() => onToggleGroup(branch.group.id)}
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
                    const npActive = project.id === selectedNpId;
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
                            onClick={() => onToggleNational(project.id)}
                          >
                            {npOpen ? "▾" : "▸"}
                          </button>
                          <button
                            type="button"
                            className={npActive ? "tree-row tree-np is-active" : "tree-row tree-np"}
                            onClick={() => onOpenNational(project)}
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
                              const fpActive = npActive && selectedFpId === federal.id;
                              return (
                                <li key={federal.id}>
                                  <button
                                    type="button"
                                    className={
                                      fpActive ? "tree-row tree-fp is-active" : "tree-row tree-fp"
                                    }
                                    onClick={() => onOpenFederal(project, federal)}
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
    </>
  );
}

function RailScheme({
  tree,
  selectedNpId,
  selectedFpId,
  expandedGroups,
  onToggleGroup,
  onOpenNational,
  onOpenFederal,
}: {
  tree: ReturnType<typeof projectTree>;
  selectedNpId?: string;
  selectedFpId?: string;
  expandedGroups: Set<ProjectGroupId>;
  onToggleGroup: (id: ProjectGroupId) => void;
  onOpenNational: (project: NationalProject) => void;
  onOpenFederal: (project: NationalProject, federal: FederalProject) => void;
}) {
  return (
    <>
      <p className="queue-lead">
        Блок-схема как генеалогическое древо: группа → нацпроекты → федеральные.
      </p>
      <div className="scheme-forest">
        {tree.map((branch) => {
          const groupOpen = expandedGroups.has(branch.group.id);
          return (
            <section key={branch.group.id} className="scheme-family">
              <div className={groupOpen ? "scheme-parent is-open" : "scheme-parent"}>
                <button
                  type="button"
                  className="scheme-box scheme-group"
                  aria-expanded={groupOpen}
                  onClick={() => onToggleGroup(branch.group.id)}
                >
                  <strong>{branch.group.title}</strong>
                  <span className="budget-pill">{formatBillionRub(branch.totalBillion)}</span>
                </button>
              </div>
              {groupOpen ? (
                <div
                  className={
                    branch.projects.length === 1 ? "scheme-children is-single" : "scheme-children"
                  }
                >
                  {branch.projects.map((project) => {
                    const npActive = project.id === selectedNpId;
                    const budget = budgetFor(project.id);
                    const showFederal = npActive && project.federalProjects.length > 0;
                    return (
                      <div key={project.id} className="scheme-node">
                        <div className={showFederal ? "scheme-parent is-open" : "scheme-parent"}>
                          <button
                            type="button"
                            className={
                              npActive ? "scheme-box scheme-np is-active" : "scheme-box scheme-np"
                            }
                            onClick={() => onOpenNational(project)}
                            aria-current={npActive ? "true" : undefined}
                          >
                            <strong>{project.title}</strong>
                            <span className="scheme-meta">
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
                            </span>
                          </button>
                        </div>
                        {showFederal ? (
                          <div
                            className={
                              project.federalProjects.length === 1
                                ? "scheme-children scheme-fps is-single"
                                : "scheme-children scheme-fps"
                            }
                          >
                            {project.federalProjects.map((federal) => {
                              const fpActive = selectedFpId === federal.id;
                              return (
                                <div key={federal.id} className="scheme-node">
                                  <button
                                    type="button"
                                    className={
                                      fpActive
                                        ? "scheme-box scheme-fp is-active"
                                        : "scheme-box scheme-fp"
                                    }
                                    onClick={() => onOpenFederal(project, federal)}
                                  >
                                    <strong>{federal.title}</strong>
                                    {federal.status === "ready" ? (
                                      <span className="ready-badge">разбираем</span>
                                    ) : (
                                      <span className="todo-badge">в работе</span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
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
        <div className="fact-tiles">
          <div className="fact-tile">
            <span>Бюджет НП «{project.title}»</span>
            <strong>{budget ? formatBillionRub(budget.totalBillion) : "не опубликован"}</strong>
            {budget?.federalBillion != null || budget?.extraBillion ? (
              <em>
                {budget.federalBillion ? `ФБ ${formatBillionRub(budget.federalBillion)}` : ""}
                {budget.extraBillion ? ` · внебюджет ${formatBillionRub(budget.extraBillion)}` : ""}
              </em>
            ) : null}
          </div>
          <div className="fact-tile">
            <span>Кто ведёт НП</span>
            <strong>{project.agency}</strong>
            <em>
              куратор {project.curator} · руководитель {project.lead}
            </em>
          </div>
        </div>
      ) : null}
      <WorkspaceBody workspace={workspace} />
    </section>
  );
}

function WorkspaceBody({ workspace }: { workspace: FederalWorkspace }) {
  return (
    <>
      <section className="canvas-block">
        <h3>Что уже известно</h3>
        <p className="queue-lead">Меры и факты из открытых материалов по этому проекту.</p>
        <ul>
          {workspace.knownMeasures.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="canvas-block">
        <h3>Компании и исполнители</h3>
        <p className="queue-lead">
          Разные ответственные: ведомство (ФОИВ), куратор в Правительстве, регионы и подрядчики.
          Цвет плитки — роль. Имена компаний не выдумываем.
        </p>
        <ul className="company-list">
          {workspace.companies.slots.map((slot) => (
            <CompanyRow key={slot.role} slot={slot} />
          ))}
        </ul>
      </section>
      <section className="canvas-block">
        <h3>Задачи</h3>
        <p className="queue-lead">
          Это не поручения из паспорта, а наш список разбора: что уже подтверждено открытыми
          материалами и какие пробелы ещё закрыть.
        </p>
        <ul className="task-list">
          {workspace.tasks.map((task) => (
            <TaskRow key={task.title} task={task} />
          ))}
        </ul>
      </section>
    </>
  );
}

const COMPANY_KIND_LABEL: Record<CompanyKind, string> = {
  agency: "ведомство",
  curator: "куратор",
  lead: "руководитель",
  region: "регион",
  vendor: "закупки",
};

function CompanyRow({ slot }: { slot: CompanySlot }) {
  return (
    <li
      className={
        slot.name
          ? `company-tile is-${slot.kind}`
          : `company-tile is-${slot.kind} is-todo`
      }
    >
      <span className="company-kind">{COMPANY_KIND_LABEL[slot.kind]}</span>
      <strong>{slot.role}</strong>
      <span>{slot.name ?? "пока пусто"}</span>
      <em>{slot.note}</em>
    </li>
  );
}

function TaskRow({ task }: { task: WorkspaceTask }) {
  return (
    <li className={task.status === "ready" ? "task-tile is-ready" : "task-tile is-todo"}>
      <span className={task.status === "ready" ? "ready-badge" : "todo-badge"}>
        {task.status === "ready" ? "известно" : "в работе"}
      </span>
      <strong>{task.title}</strong>
      <p>{task.detail}</p>
    </li>
  );
}
