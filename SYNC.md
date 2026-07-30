# Nur AI Notion Sync

This repository is a static GitHub Pages site. The structured files in `data/` and
`workflows/` are the generated, reviewable representation of the current Nur AI
agent system.

## Source precedence

1. Use the newest explicit Nur AI product definition marked **locked**.
2. Use agent-specific pages to add detail where they do not conflict with the
   locked product definition.
3. Treat broad orchestration documents as supporting guidance only.
4. Never mix BNZ Builders agents or workflows into Nur AI.
5. Record conflicts in the daily sync log instead of guessing.

## Daily sync procedure

1. Search the connected Notion workspace for Nur AI, Maryam, Aisha, Ahmad,
   skills, and handoffs.
2. Fetch each relevant page in full and record its page ID.
3. Reconcile changes using the precedence rules above.
4. Update `data/nur-ai.config.json` and `workflows/content-chain.json`.
5. Update public copy only when the source-of-truth definition changed.
6. Run `powershell -ExecutionPolicy Bypass -File scripts/validate-sync.ps1`.
7. Inspect the diff, commit, push `main`, and verify the GitHub Pages URL.
8. Add a dated log under `sync-logs/`.

The Notion connection is read-only for this workflow. Sync logs live in Git so
that every deployed revision is traceable to a commit.
