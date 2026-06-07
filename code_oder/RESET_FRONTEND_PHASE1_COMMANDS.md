# Reset Frontend Phase 1 Commands

Use from the frontend repository root.

This resets Phase 1 generated scaffold files while keeping:

```text
AI_CODE_PRINCIPLES.md
backend_docs/
code_oder/
```

## Backup first

```powershell
git status --short
git stash push -u -m "backup-before-frontend-phase1-reset"
```

## Remove generated scaffold files

```powershell
Remove-Item -Recurse -Force .\src, .\public, .\dist, .\node_modules, .\docker -ErrorAction SilentlyContinue

Remove-Item -Force `
  .\index.html, `
  .\package.json, `
  .\package-lock.json, `
  .\pnpm-lock.yaml, `
  .\yarn.lock, `
  .\vite.config.ts, `
  .\vite.config.js, `
  .\tsconfig.json, `
  .\tsconfig.app.json, `
  .\tsconfig.node.json, `
  .\tailwind.config.js, `
  .\tailwind.config.ts, `
  .\postcss.config.js, `
  .\.env.example, `
  .\.dockerignore `
  -ErrorAction SilentlyContinue

git status --short
```

## Restore backup if needed

```powershell
git stash list
git stash apply stash@{0}
```
