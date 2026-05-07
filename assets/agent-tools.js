/**
 * SAVOR — WebMCP tool surface for AI agents.
 *
 * Registers a small set of tools against navigator.modelContext (per the
 * WebMCP draft, https://webmachinelearning.github.io/webmcp/) so a
 * MCP-aware browser or extension can search the bilingual recipe corpus,
 * fetch a single record, enumerate facet values, and read the dataset
 * schema — all client-side, no backend.
 *
 * The corpus is /assets/corpus.json. Schema mirrors the field reference
 * documented on /05-dataset.html#fields (kept in sync by hand).
 */

(() => {
  if (typeof window === 'undefined') return;

  const CORPUS_URL = '/assets/corpus.json';

  // Mirrors the SAVOR-JSON Fields reference table on /05-dataset.html#fields.
  // If you edit either, edit the other.
  const DATASET_SCHEMA = {
    name: 'SAVOR-JSON',
    version: '1.0',
    extends: 'https://schema.org/Recipe',
    metadata_profile: 'Qualified Dublin Core (Cloud)',
    fields: [
      { field: '@type', type: 'string', required: true, description: 'Always "Recipe" at top level.' },
      { field: 'recipeId', type: 'URI', required: true, description: 'Persistent identifier in the sav: namespace, e.g. sav:ro/cluj/1934/placinta-mere.' },
      { field: 'name', type: '{ ro, it, en? }', required: true, description: 'Multilingual title. ro and it mandatory; en optional gloss.' },
      { field: 'description', type: '{ ro, it, en? }', required: false, description: 'Standfirst paragraph from the source.' },
      { field: 'ingredients[]', type: 'FoodEntity[]', required: true, description: 'Each entry carries food (FOODon URI), qty, unit, and optional note.' },
      { field: 'recipeInstructions[]', type: 'Step[]', required: true, description: 'Ordered list of structured steps; each step links semantic actions to foodon:culinary-process.' },
      { field: 'region', type: 'GeoNames URI', required: true, description: 'Primary geographical origin.' },
      { field: 'period', type: 'PeriodO URI', required: true, description: 'Temporal coverage. Predominant periods: interwar RO, late-XIX IT.' },
      { field: 'festive[]', type: 'Wikidata URI[]', required: false, description: 'Religious or seasonal occasions.' },
      { field: 'diet[]', type: 'enum[]', required: false, description: 'vegan, vegetarian, de-post, kosher, …' },
      { field: 'nutrition', type: 'NutritionInformation', required: false, description: 'FAO-derived per-serving estimate. Validated by USAMV.' },
      { field: 'provenance', type: 'string', required: true, description: 'Source manuscript shelfmark or born-digital row reference.' },
      { field: 'license', type: 'SPDX', required: true, description: 'CC0-1.0 or CC-BY-SA-4.0.' },
      { field: 'embedding', type: 'float[768]', required: false, description: 'LaBSE bilingual embedding. Computed at build time; not editable.' }
    ]
  };

  let corpusPromise = null;
  const loadCorpus = () => {
    if (!corpusPromise) {
      corpusPromise = fetch(CORPUS_URL, { headers: { 'Accept': 'application/json' } })
        .then((r) => { if (!r.ok) throw new Error(`corpus ${r.status}`); return r.json(); });
    }
    return corpusPromise;
  };

  const norm = (s) => (s || '').toString().toLowerCase();
  const haystack = (r) => [
    r.id, r.slug, r.title?.ro, r.title?.it, r.title?.en,
    r.summary?.ro, r.summary?.it, r.summary?.en,
    r.region?.primary, r.region?.sub, r.period,
    ...(r.ingredients || []).flatMap((i) => [i.ro, i.it, i.en])
  ].filter(Boolean).map(norm).join('   ');

  const compact = (r) => ({
    id: r.id, slug: r.slug,
    title: r.title, region: r.region, period: r.period,
    course: r.course, diet: r.diet, festive: r.festive,
    lang_origin: r.lang_origin,
    summary_en: r.summary?.en,
    url: r.url
  });

  const tools = [
    {
      name: 'search-recipes',
      description: 'Full-text and faceted search over the SAVOR bilingual recipe corpus. Combine free-text query with optional filters (region, period, course, diet, festive). Returns compact recipe summaries; use get-recipe for full records including ingredients.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text query, matched case-insensitively across titles, summaries, region names, period and ingredient names in all three languages (RO/IT/EN).' },
          region: { type: 'string', description: 'Region filter (matches primary or sub region, e.g. "Transilvania", "Veneto", "Cluj").' },
          period: { type: 'string', enum: ['fin de siècle', 'post-unification', 'interbellico', 'comunist'], description: 'Period bucket.' },
          course: { type: 'string', enum: ['primo', 'secondo', 'contorno', 'antipasto', 'dolce'], description: 'Course type.' },
          diet: { type: 'string', enum: ['vegan', 'vegetarian', 'omnivore'], description: 'Diet flag.' },
          festive: { type: 'string', description: 'Occasion (e.g. "lent", "christmas", "easter").' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        },
        additionalProperties: false
      },
      execute: async (input) => {
        const { query, region, period, course, diet, festive, limit = 10 } = input || {};
        const data = await loadCorpus();
        const q = norm(query);
        const reg = norm(region);
        const fest = norm(festive);
        const matches = data.recipes.filter((r) => {
          if (q && !haystack(r).includes(q)) return false;
          if (reg && !(norm(r.region?.primary) === reg || norm(r.region?.sub) === reg ||
                       norm(r.region?.primary).includes(reg) || norm(r.region?.sub).includes(reg))) return false;
          if (period && r.period !== period) return false;
          if (course && r.course !== course) return false;
          if (diet && r.diet !== diet) return false;
          if (fest && !(r.festive || []).map(norm).includes(fest)) return false;
          return true;
        });
        return {
          total: matches.length,
          returned: Math.min(matches.length, limit),
          recipes: matches.slice(0, limit).map(compact)
        };
      }
    },
    {
      name: 'get-recipe',
      description: 'Fetch a full SAVOR recipe record by id or slug. Returns multilingual titles, summaries, ingredients (RO/IT/EN), region, period, course, diet, festive occasions, source archive, license and persistent identifier.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'SAVOR persistent id, e.g. "SAV:RO/CLUJ/1934/PLACINTA-VARZA".' },
          slug: { type: 'string', description: 'URL-safe slug, e.g. "placinta-varza-ciuperci".' }
        },
        additionalProperties: false
      },
      execute: async (input) => {
        const { id, slug } = input || {};
        if (!id && !slug) throw new Error('Provide either id or slug.');
        const data = await loadCorpus();
        const recipe = data.recipes.find((r) =>
          (id && (r.id === id || norm(r.id) === norm(id))) ||
          (slug && r.slug === slug)
        );
        if (!recipe) return { found: false };
        return { found: true, recipe };
      }
    },
    {
      name: 'list-facets',
      description: 'Enumerate the unique values present in the corpus for a given facet (region, period, course, diet, festive, lang_origin). Useful for building filter UIs and for understanding what values search-recipes will accept.',
      inputSchema: {
        type: 'object',
        properties: {
          facet: { type: 'string', enum: ['region', 'period', 'course', 'diet', 'festive', 'lang_origin'], description: 'Which facet to enumerate.' }
        },
        required: ['facet'],
        additionalProperties: false
      },
      execute: async (input) => {
        const { facet } = input || {};
        const data = await loadCorpus();
        const set = new Set();
        for (const r of data.recipes) {
          if (facet === 'region') {
            if (r.region?.primary) set.add(r.region.primary);
            if (r.region?.sub) set.add(r.region.sub);
          } else if (facet === 'festive') {
            for (const f of r.festive || []) set.add(f);
          } else if (r[facet] != null) {
            set.add(r[facet]);
          }
        }
        return { facet, values: Array.from(set).sort(), count: data.recipes.length };
      }
    },
    {
      name: 'get-dataset-schema',
      description: 'Return the SAVOR-JSON schema field reference: every field carried by a corpus record, its type, whether it is required, and a one-line description. Mirrors /05-dataset.html#fields.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => DATASET_SCHEMA
    }
  ];

  const register = () => {
    try {
      const ctx = navigator.modelContext;
      if (!ctx || typeof ctx.provideContext !== 'function') return false;
      ctx.provideContext({ tools });
      return true;
    } catch (err) {
      console.warn('[savor] WebMCP registration failed:', err);
      return false;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register, { once: true });
  } else {
    register();
  }

  // Expose for debugging and for non-WebMCP agent shims.
  window.__savor = { tools, loadCorpus, schema: DATASET_SCHEMA };
})();
