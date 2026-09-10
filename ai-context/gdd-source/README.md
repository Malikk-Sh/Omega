# Full GDD source fragments

`part-*.md` files are the authoritative storage of the full OMEGA GDD/TDS inside GitHub.

They are split only to make connector/API editing reliable. They are **not separate design documents**.

`scripts/update-ai-context.mjs` concatenates them in lexical order without intentional content changes and writes:

```text
ai-context/GDD.md
```

Rules:

1. AI readers should normally read `../GDD.md`, not individual parts.
2. If the GDD is edited, change the relevant source part(s), then run `npm run ai:sync`.
3. Do not hand-edit generated `../GDD.md`; it is overwritten by sync.
4. Keep part filenames zero-padded so lexical order equals document order.
5. When repartitioning parts, verify the assembled GDD before committing.
