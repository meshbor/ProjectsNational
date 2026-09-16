"use client";

import { useMemo, useState } from "react";
import { DigestToolbar } from "@/components/digest-toolbar";
import { MobileSheet } from "@/components/mobile-sheet";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  NATIONAL_PROJECTS,
  PROJECT_GROUPS,
  PROJECT_SOURCES,
  RELATED_PROGRAMS,
  federalProjectById,
  nationalProjectById,
  projectHasReadyWork,
  type FederalProject,
  type NationalProject,
  type ProjectGroupId,
} from "@/lib/projects/data";
import { budgetFor, formatBillionRub } from "@/lib/projects/budget";
import { filterProjects } from "@/lib/projects/search";
import {
  LARGE_FAMILY_WORKSPACE,
  workspaceFor,
  type CompanySlot,
  type FederalWorkspace,
  type WorkspaceTask,
} from "@/lib/projects/workspace";

export function NationalProjectsApp() {
  const [query, setQuery] = useState("");
  const [selectedNpId, setSelectedNpId] = useState(ACTIVE_NATIONAL_PROJECT_ID);
  const [selectedFpId, setSelectedFpId] = useState(ACTIVE_FEDERAL_PROJECT_ID);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => filterProjects(query, "all"), [query]);
  const selectedProject =
    filtered.find((project) => project.id === selectedNpId) ??
    nationalProjectById(selectedNpId) ??
    filtered[0] ??
    NATIONAL_PROJECTS[0];
  const selectedFp =
    federalProjectById(selectedProject, selectedFpId) ??
    selectedProject.federalProjects.find((item) => item.status === "ready") ??
    selectedProject.federalProjects[0];
  const workspace = selectedFp
    ? workspaceFor(selectedProject.id, selectedFp.id)
    : null;

  function openProject(project: NationalProject, fp?: FederalProject) {
    const nextFp =
      fp ??
      project.federalProjects.find((item) => item.status === "ready") ??
      project.federalProjects[0];
    setSelectedNpId(project.id);
    setSelectedFpId(nextFp.id);
    setSheetOpen(true);
  }

  return (
    <div className="app-shell">
      <nav className="site-tabs" aria-label="Рабочее место">
        <strong className="site-brand">нацпроекты</strong>
        <p className="site-brand-note">одно место · один федеральный проект</p>
      </nav>

      <div className="section-shell">
        <DigestToolbar description="Сейчас разбираем ФП «Многодетная семья». Остальные — в работе." />

        <div className="workspace workspace-projects">
          <main className="chat-panel">
            {/* TODO(search): вернуть поиск по нацпроектам, когда появится разбор федеральных проектов и компаний. */}
            <form
              className="composer is-parked"
              onSubmit={(event) => event.preventDefault()}
              hidden
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Искать: семья, данные, дроны, ипотека"
                aria-label="Поиск по нацпроектам"
              />
            </form>

            <div className="thread">
              <ActiveWorkspace workspace={LARGE_FAMILY_WORKSPACE} />

              <QueueBlock
                title="Остальные федеральные проекты «Семья»"
                items={
                  nationalProjectById(ACTIVE_NATIONAL_PROJECT_ID)?.federalProjects.filter(
                    (item) => item.id !== ACTIVE_FEDERAL_PROJECT_ID,
                  ) ?? []
                }
                onOpen={(fp) =>
                  openProject(nationalProjectById(ACTIVE_NATIONAL_PROJECT_ID)!, fp)
                }
              />

              <section className="queue-block">
                <h2>Остальные нацпроекты</h2>
                <p className="queue-lead">Пока туду: в работе, без выдуманных компаний и задач.</p>
                <div className="news-list">
                  {filtered
                    .filter((project) => project.id !== ACTIVE_NATIONAL_PROJECT_ID)
                    .map((project) => {
                      const budget = budgetFor(project.id);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          className="news-card"
                          onClick={() => openProject(project)}
                          aria-haspopup="dialog"
                        >
                          <div className="news-meta">
                            <span className="fresh">{groupLabel(project.group)}</span>
                            <span className="todo-badge">в работе</span>
                            {budget ? (
                              <span className="budget-pill">{formatBillionRub(budget.totalBillion)}</span>
                            ) : null}
                          </div>
                          <strong>{project.title}</strong>
                          <p>{project.goal}</p>
                        </button>
                      );
                    })}
                </div>
              </section>
            </div>
          </main>

          <aside className="detail keep-on-mobile">
            <div className="desktop-only-detail">
              {workspace || !selectedFp ? (
                <div className="empty-detail">
                  <p>
                    Слева одно рабочее место — ФП «Многодетная семья». Остальные
                    нацпроекты открываются как туду «в работе».
                  </p>
                </div>
              ) : (
                <TodoCard project={selectedProject} federal={selectedFp} />
              )}
            </div>
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

      <MobileSheet
        open={sheetOpen && !workspace && Boolean(selectedFp)}
        onClose={() => setSheetOpen(false)}
        title="В работе"
      >
        {selectedFp ? <TodoCard project={selectedProject} federal={selectedFp} /> : null}
      </MobileSheet>
    </div>
  );
}

function ActiveWorkspace({ workspace }: { workspace: FederalWorkspace }) {
  const project = nationalProjectById(workspace.nationalProjectId);
  const budget = project ? budgetFor(project.id) : undefined;
  return (
    <section className="selected-card workspace-home">
      <p className="bubble-kicker">Рабочее место</p>
      <p className="fp-crumb">
        НП «{project?.title}» → ФП «{workspace.title}»
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
  onOpen,
}: {
  title: string;
  items: FederalProject[];
  onOpen: (fp: FederalProject) => void;
}) {
  return (
    <section className="queue-block">
      <h2>{title}</h2>
      <ul className="todo-queue">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item)}>
              <strong>{item.title}</strong>
              <span className="todo-badge">в работе</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TodoCard({
  project,
  federal,
}: {
  project: NationalProject;
  federal: FederalProject;
}) {
  const ready = projectHasReadyWork(project);
  return (
    <section className="selected-card">
      <p className="bubble-kicker">{groupLabel(project.group)}</p>
      <p className="fp-crumb">
        НП «{project.title}» → ФП «{federal.title}»
      </p>
      <h2>{federal.title}</h2>
      <p className="why">
        Этот федеральный проект ещё в работе. Сейчас одно рабочее место — «Многодетная семья».
        Здесь не заполняем компании и задачи, чтобы не выдумывать.
      </p>
      <p>
        <span className="todo-badge">в работе</span>
      </p>
      <dl>
        <div>
          <dt>Нацпроект</dt>
          <dd>{project.title}</dd>
        </div>
        <div>
          <dt>Куратор / ФОИВ</dt>
          <dd>
            {project.curator} · {project.agency}
          </dd>
        </div>
      </dl>
      <h3>Федеральные проекты этого нацпроекта</h3>
      <ul className="todo-queue">
        {project.federalProjects.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>{" "}
            <span className={item.status === "ready" ? "ready-badge" : "todo-badge"}>
              {item.status === "ready" ? "разбираем" : "в работе"}
            </span>
          </li>
        ))}
      </ul>
      {!ready ? (
        <p className="queue-lead">Туду: разобрать паспорт, меры, закупки и исполнителей.</p>
      ) : null}
    </section>
  );
}

function groupLabel(id: ProjectGroupId) {
  return PROJECT_GROUPS.find((group) => group.id === id)?.title ?? id;
}
