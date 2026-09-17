import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RAIL_DEFAULT,
  RAIL_MIN,
  clampRailWidth,
  fixedRailWidth,
  railLayoutPreset,
  railMaxForWorkspace,
  twoThirdsRailWidth,
} from "./rail";

test("максимум левой колонки — ⅔ рабочего экрана, не константа", () => {
  assert.equal(railMaxForWorkspace(1200), 800);
  assert.equal(railMaxForWorkspace(1800), 1200);
  assert.notEqual(twoThirdsRailWidth(1200), twoThirdsRailWidth(1800));
});

test("при неизвестной ширине экрана остаётся узкий пресет", () => {
  assert.equal(railMaxForWorkspace(0), RAIL_DEFAULT);
});

test("колонка не уже минимума и не шире ⅔ экрана", () => {
  assert.equal(clampRailWidth(100, 800), RAIL_MIN);
  assert.equal(clampRailWidth(900, 800), 800);
  assert.equal(clampRailWidth(400, 800), 400);
});

test("узкий пресет — фиксированные 320px, пока это меньше ⅔", () => {
  assert.equal(fixedRailWidth(1200), RAIL_DEFAULT);
  assert.equal(fixedRailWidth(300), 200);
});

test("пресеты ширины определяются по текущему экрану", () => {
  assert.equal(railLayoutPreset(320, 0), "fixed");
  assert.equal(railLayoutPreset(320, 1200), "fixed");
  assert.equal(railLayoutPreset(800, 1200), "wide");
  assert.equal(railLayoutPreset(450, 1200), "custom");
});
