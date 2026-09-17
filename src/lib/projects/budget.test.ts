import assert from "node:assert/strict";
import { test } from "node:test";
import { NATIONAL_PROJECTS } from "./data";
import { everyProjectHasBudget, formatBillionRub, PROJECT_BUDGETS } from "./budget";

test("every national project has a total budget", () => {
  assert.equal(everyProjectHasBudget(), true);
  assert.equal(Object.keys(PROJECT_BUDGETS).length, NATIONAL_PROJECTS.length);
  for (const project of NATIONAL_PROJECTS) {
    assert.ok(PROJECT_BUDGETS[project.id].totalBillion > 0);
  }
});

test("formats trillions and billions", () => {
  assert.equal(formatBillionRub(17890), "17,89 трлн ₽");
  assert.equal(formatBillionRub(113), "113 млрд ₽");
});
