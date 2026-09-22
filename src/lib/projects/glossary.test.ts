import assert from "node:assert/strict";
import { test } from "node:test";
import { GLOSSARY } from "./glossary";

test("глоссарий объясняет основные сокращения", () => {
  const abbrs = GLOSSARY.map((item) => item.abbr);
  for (const needed of ["НП", "ФП", "ФОИВ", "ФБ", "ЕИС", "OpenRAN", "ФРИИ", "РФРИТ", "ОЗП", "ИЦК"]) {
    assert.ok(abbrs.includes(needed), `нет ${needed}`);
  }
  assert.ok(GLOSSARY.every((item) => item.meaning.length > 8));
});
