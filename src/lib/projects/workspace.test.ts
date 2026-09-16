import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIVE_FEDERAL_PROJECT_ID,
  ACTIVE_NATIONAL_PROJECT_ID,
  NATIONAL_PROJECTS,
  projectHasReadyWork,
} from "./data";
import { LARGE_FAMILY_WORKSPACE, workspaceFor } from "./workspace";

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
  assert.equal(workspaceFor("youth", "Мы вместе"), null);
});
