---
name: get-recipe
description: Fetch a full SAVOR recipe record by persistent id or slug — multilingual titles, summaries, ingredients, region, period, course, diet, festive occasions, source archive, license and PID.
---

# get-recipe

## Purpose

Retrieve the complete record for a single recipe identified by its
SAVOR persistent id (`recipeId`) or its URL-safe slug. Use this after
a `search-recipes` call when the agent needs the full payload —
ingredient list with bilingual labels, archival provenance, persistent
identifier — rather than the compact summary returned by search.

## When to use

- After search, when a user picks one result.
- "What's in the Venetian rice and peas?"
- "Where does the Cluj cabbage pie come from? Who recorded it?"
- "Cite this recipe."

## Inputs

Provide *one* of:

| field | type   | notes                                                            |
|-------|--------|------------------------------------------------------------------|
| id    | string | SAVOR persistent id, e.g. `SAV:RO/CLUJ/1934/PLACINTA-VARZA`.     |
| slug  | string | URL slug, e.g. `placinta-varza-ciuperci`.                        |

Returns `{ found: false }` if neither matches.

## Output

```json
{
  "found": true,
  "recipe": {
    "id":          "SAV:IT/VENETO/1865/RISI-E-BISI",
    "no":          "0521",
    "slug":        "risi-e-bisi",
    "lang_origin": "it",
    "title":       { "it": "Risi e bisi", "ro": "...", "en": "..." },
    "region":      { "primary": "Veneto", "sub": "Venezia" },
    "period":      "post-unification",
    "period_years": [1861, 1900],
    "course":      "primo",
    "diet":        "vegetarian",
    "festive":     ["easter", "st-mark"],
    "summary":     { "it": "...", "ro": "...", "en": "..." },
    "ingredients": [
      { "qty": "300 g", "it": "riso vialone nano", "ro": "orez vialone nano", "en": "vialone nano rice" }
    ],
    "source": {
      "archive":   "Casa Artusi, biblioteca",
      "shelfmark": "CA-veneto-1865-021",
      "recorded":  { "place": "Venezia, Cannaregio", "year": 1865, "by": "ms. ricettario familiare Tron" }
    },
    "license": "CC BY-SA 4.0",
    "pid":     "echoes:rd-0521",
    "url":     "/03-search.html#risi-e-bisi"
  }
}
```

## Example

```js
await navigator.modelContext.invoke('get-recipe', { slug: 'risi-e-bisi' });
```

## Citation

Records carry a persistent `pid` (in the `echoes:` namespace) and a
SPDX license. Cite both when surfacing recipe content to a user.
