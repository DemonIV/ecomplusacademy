import { AIRTABLE } from "@/config/airtable";

/**
 * Compares the Airtable table with config/airtable.ts: a renamed column or a
 * stage option spelled differently would otherwise fail silently (writes to an
 * unknown field are rejected; an unknown option would be added as a new one).
 */

type TableShape = { fields: Array<{ name: string; type: string; options?: { choices?: Array<{ name: string }> } }> };

export type AirtableCheck = { missingFields: string[]; missingOptions: string[] };

export function checkTable(table: TableShape): AirtableCheck {
  const byName = new Map(table.fields.map((f) => [f.name, f]));
  const missingFields = Object.values(AIRTABLE.fields).filter((name) => !byName.has(name));

  const expected: Array<[string, readonly string[]]> = [
    [AIRTABLE.fields.channel, [AIRTABLE.channel]],
    [AIRTABLE.fields.stage, [...new Set(Object.values(AIRTABLE.stages))]],
    [AIRTABLE.fields.interest, Object.values(AIRTABLE.interest)],
  ];
  const missingOptions: string[] = [];
  for (const [fieldName, values] of expected) {
    const field = byName.get(fieldName);
    if (!field?.options?.choices) continue;
    const have = new Set(field.options.choices.map((c) => c.name));
    for (const value of values) if (!have.has(value)) missingOptions.push(`${fieldName}: ${value}`);
  }
  return { missingFields, missingOptions };
}
