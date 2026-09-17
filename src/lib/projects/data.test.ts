import assert from "node:assert/strict";
import { test } from "node:test";
import { NATIONAL_PROJECTS, PROJECT_GROUPS } from "./data";

test("catalog has 20 national projects across all goals", () => {
  assert.equal(NATIONAL_PROJECTS.length, 20);
  assert.equal(new Set(NATIONAL_PROJECTS.map((project) => project.id)).size, 20);
  for (const project of NATIONAL_PROJECTS) {
    assert.ok(PROJECT_GROUPS.some((group) => group.id === project.group));
    assert.ok(project.federalProjects.every((item) => item.title.length > 0));
    assert.ok(project.highlights.length > 0);
  }
});
