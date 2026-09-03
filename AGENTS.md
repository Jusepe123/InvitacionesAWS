# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains the PDF invitation prototype:

- `invitation-template.tex`: shared A4 layout, event copy, colors, QR code, and asset placement.
- `preview-institucion.tex`: sample for an institution without a named recipient.
- `preview-persona.tex`: sample for a recipient with a name and role.
- `logo.png` and `indice.png`: approved club branding and decorative event artwork.
- `Invitacion-SCD-*.pdf` and `preview-*.png`: generated review artifacts.

Keep reusable presentation logic in `invitation-template.tex`; recipient-specific values belong in small input files. If the web application is added, place application code under `src/`, static assets under `public/`, and automated tests under `tests/` or beside modules as `*.test.*`.

## Build, Test, and Development Commands

Run commands from the repository root in PowerShell:

```powershell
pdflatex --disable-installer -interaction=nonstopmode -halt-on-error -jobname="Invitacion-SCD-institucion" preview-institucion.tex
pdflatex --disable-installer -interaction=nonstopmode -halt-on-error -jobname="Invitacion-SCD-persona" preview-persona.tex
pdftoppm -png -f 1 -singlefile -r 120 Invitacion-SCD-institucion.pdf preview-institucion
```

The first two commands build the single-page PDFs. The last command produces a PNG for visual review. Run LaTeX twice when references, links, or QR metadata change.

## Coding Style & Naming Conventions

Use two-space indentation in LaTeX blocks and group colors, assets, content, and footer sections with short comments. Define reusable values as descriptive PascalCase commands, such as `\RecipientName`. Use lowercase kebab-case for source variants (`preview-persona.tex`) and descriptive output names (`Invitacion-SCD-persona.pdf`). Preserve UTF-8 Spanish text and escape LaTeX-special characters in imported data.

## Testing Guidelines

There is no automated test suite yet. Every change must compile with `-halt-on-error`, produce exactly one A4 page, and be visually inspected for clipping, overflow, accents, and legible contrast. Scan the generated QR code and confirm it resolves to `https://luma.com/r65j1ukn`. Test both recipient variants after shared-template changes.

## Commit & Pull Request Guidelines

No Git history is available in this directory. Use concise, imperative commits with an optional Conventional Commit prefix, for example `feat: add batch invitation input`. Pull requests should describe the change, list validation commands, and include before/after PDF or PNG previews for visual modifications. Do not introduce AWS logos or imply AWS sponsorship without explicit approval.

## Generated Files & Sensitive Data

Do not commit LaTeX intermediates such as `*.aux`, `*.log`, `*.out`, or `*.synctex.gz`. Keep recipient spreadsheets, email addresses, and generated personalized invitations out of version control unless they contain approved sample data.
