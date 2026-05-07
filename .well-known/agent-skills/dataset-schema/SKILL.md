---
name: dataset-schema
description: Return the SAVOR-JSON field reference — every field carried by a corpus record, its type, requiredness, and a one-line description. Mirrors the human-readable schema documented at /05-dataset.html#fields.
---

# dataset-schema

## Purpose

Programmatic access to the SAVOR-JSON schema. SAVOR-JSON extends
`schema.org/Recipe` with culinary-heritage-specific fields; the
metadata spine is Qualified Dublin Core for cloud interoperability.
This skill returns the same field reference that is rendered for
humans on the dataset documentation page, in machine-readable form.

## When to use

- Before producing or validating a SAVOR-JSON record.
- When an agent needs to know which fields are required vs. optional.
- "What does the SAVOR schema look like?" / "How is a recipe
  represented?"

## Inputs

None. Takes an empty object.

## Output

```json
{
  "name":             "SAVOR-JSON",
  "version":          "1.0",
  "extends":          "https://schema.org/Recipe",
  "metadata_profile": "Qualified Dublin Core (Cloud)",
  "fields": [
    { "field": "@type",      "type": "string",          "required": true,  "description": "..." },
    { "field": "recipeId",   "type": "URI",             "required": true,  "description": "..." },
    { "field": "name",       "type": "{ ro, it, en? }", "required": true,  "description": "..." },
    { "field": "ingredients[]", "type": "FoodEntity[]", "required": true,  "description": "..." },
    { "field": "region",     "type": "GeoNames URI",    "required": true,  "description": "..." },
    { "field": "period",     "type": "PeriodO URI",     "required": true,  "description": "..." },
    { "field": "diet[]",     "type": "enum[]",          "required": false, "description": "..." }
  ]
}
```

(The actual response includes all 14 fields — see the implementation
or `/05-dataset.html#fields` for the full list.)

## Notes

- The schema document at this URL is the *canonical* description of a SAVOR record. Recipe data returned by `get-recipe` conforms to it (with the caveat that `assets/corpus.json` is a sample slice — full corpus access is via the REST/SPARQL endpoints documented at `/05-dataset.html`).
- Vocabularies referenced in field types: `schema.org`, `FOODon`, `GeoNames`, `PeriodO`, `Wikidata`, SPDX licence identifiers.

## Example

```js
const schema = await navigator.modelContext.invoke('get-dataset-schema', {});
const required = schema.fields.filter(f => f.required).map(f => f.field);
```
