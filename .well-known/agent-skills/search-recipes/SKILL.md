---
name: search-recipes
description: Full-text and faceted search over the SAVOR bilingual recipe corpus (Romanian and Italian, c. 1860–1980).
---

# search-recipes

## Purpose

Find recipes in the SAVOR corpus by free-text query and/or facet filters
(region, period, course, diet, festive occasion). The corpus is
bilingual: titles, summaries, and ingredient names are matched
across Romanian, Italian, and English glosses simultaneously, so a
query like `cabbage`, `varză`, or `cavolo` returns the same
underlying records.

## When to use

- "Find a vegetarian recipe for Lent."
- "What did people in Transylvania eat during the interwar years?"
- "Show me Venetian dishes."
- "Christmas cookies from Moldova."

## Inputs

All inputs are optional; pass any combination.

| field   | type    | notes                                                                 |
|---------|---------|-----------------------------------------------------------------------|
| query   | string  | Free-text. Case-insensitive substring match across titles, summaries, region, period and ingredient names in RO/IT/EN. |
| region  | string  | Matches `region.primary` or `region.sub`. e.g. `Transilvania`, `Veneto`, `Cluj`, `Roma`. |
| period  | enum    | `fin de siècle` · `post-unification` · `interbellico` · `comunist`.    |
| course  | enum    | `primo` · `secondo` · `contorno` · `antipasto` · `dolce`.              |
| diet    | enum    | `vegan` · `vegetarian` · `omnivore`.                                   |
| festive | string  | `lent` · `christmas` · `christmas-eve` · `easter` · `new-year` · `st-mark`. |
| limit   | integer | 1–50, default 10.                                                      |

Use the `list-facets` tool to enumerate the actual values present in the corpus.

## Output

```json
{
  "total":    8,
  "returned": 3,
  "recipes": [
    {
      "id":          "SAV:RO/CLUJ/1934/PLACINTA-VARZA",
      "slug":        "placinta-varza-ciuperci",
      "title":       { "ro": "...", "it": "...", "en": "..." },
      "region":      { "primary": "Transilvania", "sub": "Cluj" },
      "period":      "interbellico",
      "course":      "primo",
      "diet":        "vegan",
      "festive":     ["lent", "christmas-eve"],
      "lang_origin": "ro",
      "summary_en":  "A thin pie of cabbage softened in oil ...",
      "url":         "/04-recipe.html"
    }
  ]
}
```

For the full record (ingredients, source archive, persistent id), call `get-recipe` with the `id` or `slug` returned here.

## Example

```js
await navigator.modelContext.invoke('search-recipes', {
  diet: 'vegan',
  festive: 'lent'
});
// → { total: 1, returned: 1, recipes: [ { slug: "placinta-varza-ciuperci", ... } ] }
```

## Surface

This skill is implemented client-side via WebMCP on every public SAVOR page (`/02-website.html`, `/03-search.html`, `/04-recipe.html`, `/05-dataset.html`) — it operates on `/assets/corpus.json` in the browser, no server round-trip.
