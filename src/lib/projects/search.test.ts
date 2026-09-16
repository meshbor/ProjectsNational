import assert from "node:assert/strict";
import { test } from "node:test";
import { filterProjects } from "./search";

test("данные finds the data economy project", () => {
  const found = filterProjects("данные", "all");
  assert.ok(found.some((project) => project.id === "data"));
});

test("семья finds the family project", () => {
  const found = filterProjects("семья", "all");
  assert.ok(found.some((project) => project.id === "family"));
});

test("дроны finds BAS", () => {
  const found = filterProjects("дроны", "all");
  assert.ok(found.some((project) => project.id === "bas"));
});
