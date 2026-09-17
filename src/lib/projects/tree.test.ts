import assert from "node:assert/strict";
import { test } from "node:test";
import { NATIONAL_PROJECTS, PROJECT_GROUPS } from "./data";
import { budgetTotal } from "./budget";
import { projectTree } from "./tree";

test("tree has every national project under its goal group", () => {
  const tree = projectTree();
  assert.equal(tree.length, PROJECT_GROUPS.length);
  const ids = tree.flatMap((branch) => branch.projects.map((project) => project.id));
  assert.equal(ids.length, NATIONAL_PROJECTS.length);
  assert.equal(new Set(ids).size, NATIONAL_PROJECTS.length);
  const family = tree.find((branch) => branch.group.id === "people")?.projects[0];
  assert.equal(family?.id, "family");
});

test("projects inside a group are ordered by descending budget", () => {
  for (const branch of projectTree()) {
    for (let index = 1; index < branch.projects.length; index += 1) {
      assert.ok(
        budgetTotal(branch.projects[index - 1].id) >= budgetTotal(branch.projects[index].id),
      );
    }
    const sum = branch.projects.reduce((total, project) => total + budgetTotal(project.id), 0);
    assert.equal(branch.totalBillion, sum);
  }
});
