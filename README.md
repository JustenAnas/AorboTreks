# AORBO Treks

A single-page site for AORBO Treks, a guided Himalayan trekking company. The page follows a climb from base camp to summit: a parallax mountain hero with trek search, an altitude meter, a horizontal trek catalogue, trekker stories, and a summit booking section with an animated night-sky scene.

## Features

- Parallax ridgelines, clouds, birds, and scroll-driven altitude readout
- Client-side trek search that jumps to the matching trek card
- Horizontal trek catalogue with difficulty, duration, altitude, season, and price
- Trekker stories and a responsive booking form
- Lazy-loaded Three.js summit sky that pauses when offscreen and respects reduced-motion preferences
- Static client-side rendering with a standard Vite production build

The booking form is currently a client-side UI only; it does not submit to a backend.

## Tech stack

- React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui components built on Radix UI
- GSAP with ScrollTrigger and Lenis for scroll animation
- Three.js with React Three Fiber for the summit sky
- Vite 8 for development and the production build
- Vitest and Testing Library for tests

## Getting started

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

The dev server runs on <http://localhost:8080> by default (see `vite.config.ts`).

## Scripts

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `npm run dev`        | Start the Vite dev server         |
| `npm run build`      | Build for production into `dist/` |
| `npm run build:dev`  | Build in development mode         |
| `npm run preview`    | Preview the production build      |
| `npm run typecheck`  | Run the TypeScript compiler       |
| `npm test`           | Run the Vitest suite once         |
| `npm run test:watch` | Run Vitest in watch mode          |
| `npm run lint`       | Lint with ESLint                  |
| `npm run format`     | Format with Prettier              |

## Project structure

```text
index.html             HTML shell with metadata and font links
src/
  components/
    summit-sky.tsx   Three.js night-sky scene
    ui/              shadcn/ui components
  lib/
    trek-search.ts   Pure trek search helper
    utils.ts         Class-name helper
  test/              Vitest setup and tests
  App.tsx            Home page
  main.tsx           React entry point
  styles.css         Theme tokens, Tailwind layers, animations
public/              Favicon and robots.txt
```

## Deployment

`npm run build` produces a static site in `dist/` that can be deployed to any static host. `npm run preview` serves that build locally.
