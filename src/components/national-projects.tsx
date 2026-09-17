"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  NATIONAL_PROJECTS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  nationalProjectById,
  type FederalProject,
  type NationalProject,
} from "@/lib/projects/data";
import { budgetFor, formatBillionRub, projectsByBudgetDesc } from "@/lib/projects/budget";
import {
  LARGE_FAMILY_WORKSPACE,
  workspaceForNationalProject,
  type CompanySlot,
  type FederalWorkspace,
  type WorkspaceTask,
} from "@/lib/projects/workspace";

const RAIL_DEFAULT = 280;
const RAIL_MIN = 168;
const RAIL_MAX = 440;
const RAIL_COLLAPSED = 48;

export function NationalProjectsApp() {
  const [selectedNpId, setSelectedNpId] = useState(ACTIVE_NATIONAL_PROJECT_ID);
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);

  const ranked = useMemo(() => projectsByBudgetDesc(NATIONAL_PROJECTS), []);
  const selectedProject =
    nationalProjectById(selectedNpId) ?? ranked[0] ?? NATIONAL_PROJECTS[0];
  const workspace = workspaceForNationalProject(selectedProject);
  const columnWidth = railCollapsed ? RAIL_COLLAPSED : railWidth;

  function openProject(project: NationalProject) {
    setSelectedNpId(project.id);
  }

  function onResizerPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startWidth: railCollapsed ? RAIL_DEFAULT : railWidth,
    };
    if (railCollapsed) setRailCollapsed(false);
  }

  function onResizerPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const next = drag.current.startWidth + (event.clientX - drag.current.startX);
    if (next < 120) {
      setRailCollapsed(true);
      return;
    }
    setRailCollapsed(false);
    setRailWidth(Math.min(RAIL_MAX, Math.max(RAIL_MIN, next)));
  }

  function onResizerPointerUp() {
    drag.current = null;
  }

  return (
    <div className="app-shell">
      <nav className="site-tabs" aria-label="Рабочее место">
        <strong className="site-brand">нацпроекты</strong>
        <p className="site-brand-note">каталог слева · канва в центре</p>
      </nav>

      <div className="section-shell">
        <DigestToolbar
          description={
            selectedProject.id === ACTIVE_NATIONAL_PROJECT_ID
              ? "Сейчас разбираем ФП «Многодетная семья». Остальные — в работе."
              : `Канва НП «${selectedProject.title}». Подрядчиков не выдумываем.`
          }
        />

        <div
          className="workspace workspace-projects"
          style={{ "--projects-rail-width": `${columnWidth}px` } as CSSProperties}
        >
          <aside
            className={railCollapsed ? "projects-rail is-collapsed" : "projects-rail"}
            aria-label="Нацпроекты"
          >
            <header className="projects-rail-head">
              <h2>Нацпроекты</h2>
              <button
                type="button"
                className="rail-toggle"
                aria-expanded={!railCollapsed}
                onClick={() => setRailCollapsed((value) => !value)}
              >
                {railCollapsed ? "Развернуть" : "Сжать"}
              </button>
            </header>
            {railCollapsed ? (
              <p className="projects-rail-strip">по бюджету</p>
            ) : (
              <div className="projects-rail-list">
                <p className="queue-lead">По убыванию бюджета, 2025–2030.</p>
                {ranked.map((project) => {
                  const budget = budgetFor(project.id);
                  const active = project.id === selectedProject.id;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      className={active ? "rail-project is-active" : "rail-project"}
                      onClick={() => openProject(project)}
                      aria-current={active ? "page" : undefined}
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
              </div>
            )}
          </aside>

          <button
            type="button"
            className="rail-resizer"
            aria-label="Ширина колонки нацпроектов"
            onPointerDown={onResizerPointerDown}
            onPointerMove={onResizerPointerMove}
            onPointerUp={onResizerPointerUp}
            onPointerCancel={onResizerPointerUp}
          />

          <main className="chat-panel">
            <div className="thread">
              <ActiveWorkspace workspace={workspace} />
              {selectedProject.id === ACTIVE_NATIONAL_PROJECT_ID ? (
                <QueueBlock
                  title="Остальные федеральные проекты «Семья»"
                  items={
                    nationalProjectById(ACTIVE_NATIONAL_PROJECT_ID)?.federalProjects.filter(
                      (item) => item.id !== ACTIVE_FEDERAL_PROJECT_ID,
                    ) ?? []
                  }
                />
              ) : null}
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
      <p className="bubble-kicker">Рабочее место</p>
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

function QueueBlock({
  title,
  items,
}: {
  title: string;
  items: FederalProject[];
}) {
  return (
    <section className="queue-block">
      <h2>{title}</h2>
      <ul className="todo-queue">
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span className="todo-badge">в работе</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
