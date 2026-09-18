import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  NATIONAL_PROJECTS,
  nationalProjectById,
  projectHasReadyWork,
} from "./data";
import {
  LARGE_FAMILY_WORKSPACE,
  draftWorkspaceFor,
  workspaceFor,
  workspaceForNationalProject,
} from "./workspace";

test("only one federal project is in the workspace", () => {
  const ready = NATIONAL_PROJECTS.flatMap((project) =>
    project.federalProjects
      .filter((item) => item.status === "ready")
      .map((item) => `${project.id}:${item.id}`),
  );
  assert.deepEqual(ready, [`${ACTIVE_NATIONAL_PROJECT_ID}:${ACTIVE_FEDERAL_PROJECT_ID}`]);
  assert.equal(ACTIVE_FEDERAL_PROJECT_ID, "large-family");
});

test("other national projects stay marked as in progress", () => {
  for (const project of NATIONAL_PROJECTS) {
    if (project.id === ACTIVE_NATIONAL_PROJECT_ID) {
      assert.equal(projectHasReadyWork(project), true);
      continue;
    }
    assert.equal(projectHasReadyWork(project), false);
    assert.ok(project.federalProjects.every((item) => item.status === "todo"));
  }
});

test("large-family workspace does not invent contractor names", () => {
  assert.equal(LARGE_FAMILY_WORKSPACE.title, "Многодетная семья");
  const named = LARGE_FAMILY_WORKSPACE.companies.slots.filter((slot) => slot.name);
  assert.ok(named.every((slot) => slot.role !== "Подрядчики и исполнители закупок"));
  assert.ok(
    LARGE_FAMILY_WORKSPACE.companies.slots.some(
      (slot) => slot.role === "Подрядчики и исполнители закупок" && slot.name === null,
    ),
  );
  assert.ok(workspaceFor("family", "large-family"));
  assert.equal(workspaceFor("family")?.title, "Семья");
  assert.equal(workspaceFor("family", "large-family")?.title, "Многодетная семья");
});

test("other national projects open a draft workspace without invented contractors", () => {
  const youth = NATIONAL_PROJECTS.find((project) => project.id === "youth");
  assert.ok(youth);
  const workspace = workspaceForNationalProject(youth);
  assert.equal(workspace.title, "Молодёжь и дети");
  assert.ok(
    workspace.companies.slots.some(
      (slot) => slot.role === "Подрядчики и исполнители закупок" && slot.name === null,
    ),
  );
  const namedContractors = draftWorkspaceFor(youth).companies.slots.filter(
    (slot) => slot.role === "Подрядчики и исполнители закупок" && slot.name,
  );
  assert.equal(namedContractors.length, 0);
  assert.ok(workspaceFor("youth"));
  const youthByFederal = workspaceFor("youth", "Мы вместе");
  assert.ok(youthByFederal);
  assert.equal(youthByFederal.title, "Мы вместе");
  assert.equal(youthByFederal.federalProjectId, "Мы вместе");
  assert.notEqual(youthByFederal.title, workspaceForNationalProject(youth).title);
  assert.equal(workspaceFor("missing-project"), null);
});

test("исполнители помечены ролями, подрядчиков не выдумываем", () => {
  const kinds = LARGE_FAMILY_WORKSPACE.companies.slots.map((slot) => slot.kind);
  assert.deepEqual(kinds, ["agency", "curator", "region", "vendor"]);
  assert.equal(
    LARGE_FAMILY_WORKSPACE.companies.slots.find((slot) => slot.kind === "vendor")?.name,
    null,
  );
});

test("family NP canvas is not the large-family FP; other NPs stay drafts", () => {
  const family = nationalProjectById("family");
  const youth = nationalProjectById("youth");
  assert.ok(family && youth);
  const familyNp = workspaceForNationalProject(family);
  assert.equal(familyNp.title, "Семья");
  assert.notEqual(familyNp, LARGE_FAMILY_WORKSPACE);
  assert.equal(workspaceFor("family", "maternity")?.title, "Охрана материнства и детства");
  const draft = workspaceForNationalProject(youth);
  assert.equal(draft.summary, youth.goal);
  assert.deepEqual(draft.knownMeasures, youth.highlights);
  assert.equal(draft.companies.slots[0]?.name, youth.agency);
});
