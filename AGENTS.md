# Repository Guidelines

## Project Structure & Module Organization

The production application is a React 19, TypeScript, and Vite static site. Keep page orchestration in `src/App.tsx`, reusable UI in `src/components/`, and Markdown, Excel, history, and PDF utilities in `src/lib/`. Shared types live in `src/types.ts`; styles are in `src/styles.css`. Browser assets belong in `public/assets/`.

The root LaTeX files are the design reference: `invitation-template.tex` contains the shared A4 layout, while `preview-institucion.tex` and `preview-persona.tex` provide sample data. Generated review files belong in `samples/`; LaTeX intermediates and production builds are ignored.

## Build, Test, and Development Commands

Run commands from the repository root:

```powershell
npm ci
npm run dev
npm run lint
npm run build
npm run check
npm run pdf:build
npm run preview
```

`dev` starts Vite, `lint` checks source quality, and `build` performs TypeScript validation and emits `dist/`. `preview` serves that production build locally. Use `check` before every commit. `pdf:build` requires MiKTeX and Poppler and regenerates both PDF/PNG samples.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, single quotes, and extensionless relative imports. Use PascalCase for React components and types, camelCase for functions and variables, and kebab-case for generated files. Keep Spanish copy in UTF-8 and preserve accents. Escape imported values before introducing them into markup or LaTeX.

## Testing Guidelines

No unit-test framework or coverage threshold is configured. Treat `npm run check` as the minimum gate. For PDF changes, test institutional and named-recipient flows, confirm one A4 page, inspect text overflow, and verify the QR, Luma URL, and email links. For Excel changes, test the downloadable template, duplicate institution names, and a multi-row `.xlsx` upload.

## Commit & Pull Request Guidelines

Use concise Conventional Commits, for example `fix: validate bulk spreadsheet input`. Pull requests should explain user-visible behavior, list validation commands, and include updated PNG samples for design changes. Never commit real recipient spreadsheets, generated personalized invitations, credentials, or AWS-owned logos.

## Deployment & Privacy

Amplify builds from `amplify.yml` and publishes `dist/`. The app has no authentication or backend; invitation history remains in browser `localStorage`. Spreadsheet input is untrusted: retain file-size and row limits and avoid libraries with unresolved advisories. Do not add telemetry or external data storage without documenting consent and retention.
