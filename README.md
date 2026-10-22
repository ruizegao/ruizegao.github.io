# ruizegao.github.io

My academic homepage. Built with [Astro](https://astro.build), deployed to GitHub Pages.

## Everyday edits (no HTML needed)

| To change…                   | Edit                          |
|------------------------------|-------------------------------|
| Name, bio, links, email      | `src/data/profile.yaml`       |
| Publications                 | `src/data/publications.yaml`  |
| News items                   | `src/data/news.yaml`          |
| The figure at the top        | `hero:` in `profile.yaml`     |
| Photo, teaser images, CV PDF | drop files into `public/images/` (CV: `public/cv.pdf`) |

Push to `main` and the site rebuilds itself in about a minute.

Empty sections (no publications, no news) are hidden automatically.

## See changes live on your computer

Needs [Node.js](https://nodejs.org) 22 or newer.

```sh
npm install      # once
npm run dev      # then open http://localhost:4321 — it refreshes as you save
```

## How it's put together

```
src/
  data/          ← your content (YAML)
  pieces/        ← interactive figures; each file is one piece
  components/    ← Hero (the figure slot), Publication (one paper)
  pages/         ← index.astro arranges the home page
  layouts/       ← the <head>, fonts and link previews shared by every page
  styles/        ← global.css; colors, fonts and spacing are at the top
public/          ← copied as-is: images, cv.pdf, favicon
```

### Adding an interactive piece

1. Create `src/pieces/my-piece.js` exporting `default function (canvas) { … }`.
   Draw with the 2D canvas API, raw WebGL, or three.js (`npm install three`
   and `import * as THREE from 'three'` at the top of the file).
2. In `profile.yaml`, set `hero: { type: piece, src: my-piece, caption: "…" }`.

`adaptive-grid.js` shows the conventions: it resizes with the frame, sleeps when
off-screen, follows light/dark mode via CSS variables, and respects
"reduce motion".

### Adding a page (e.g. a project page)

Create `src/pages/projects/paper-name.astro` (or `.md`). It becomes
`/projects/paper-name/`. Wrap it in `<Base title="…">` from `layouts/Base.astro`
to get the same fonts and styling.

## One-time GitHub setup

1. Create a public repo named exactly `ruizegao.github.io`.
2. Push this folder to its `main` branch.
3. Repo **Settings → Pages → Source: GitHub Actions**.
4. Wait for the green check under the **Actions** tab, then open https://ruizegao.github.io.

Custom domain later: add it under Settings → Pages, and update `site:` in
`astro.config.mjs`.
