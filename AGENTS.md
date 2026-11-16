# Project notes

## Scene architecture

- Keep decorative Three.js scenes in lazy, client-mounted components and pause them offscreen; the static Vite SPA avoids idle GPU work.
- Resolve scene colors from global semantic CSS tokens; the canvas must share the page palette.
- Keep trek matching in a browser-safe pure module so search can be tested without rendering animations.
