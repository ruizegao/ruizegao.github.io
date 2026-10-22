// ─────────────────────────────────────────────────────────────
//  adaptive-grid — a quadtree that refines wherever attention is.
//
//  The contract for every piece in src/pieces/:
//    export default function (canvas) { ... }
//  Draw into the canvas however you like (2D, WebGL, three.js).
//  This one uses the plain 2D canvas API and no libraries.
// ─────────────────────────────────────────────────────────────

const MAX_DEPTH = 5;     // finest level of subdivision
const REFINE = 1.0;      // larger → more cells refine around the focus
const EASE = 0.1;        // how quickly the focus follows the pointer
const IDLE_MS = 2500;    // after this long without input, drift on its own

export default function adaptiveGrid(canvas) {
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1;
  const focus = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let lastInput = -Infinity;
  let visible = true;
  let frame = 0;

  // ── sizing ────────────────────────────────────────────────
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (lastInput === -Infinity) {
      target.x = focus.x = w * 0.62;
      target.y = focus.y = h * 0.45;
    }
    draw();
  }
  new ResizeObserver(resize).observe(canvas);

  // ── input ─────────────────────────────────────────────────
  canvas.style.touchAction = 'pan-y';
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    target.x = e.clientX - r.left;
    target.y = e.clientY - r.top;
    lastInput = performance.now();
    if (reduceMotion) { focus.x = target.x; focus.y = target.y; draw(); }
    else wake();
  };
  canvas.addEventListener('pointermove', point);
  canvas.addEventListener('pointerdown', point);

  // ── only animate while on screen ──────────────────────────
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(canvas);
  document.addEventListener('visibilitychange', wake);

  // ── drawing ───────────────────────────────────────────────
  function colors() {
    const s = getComputedStyle(canvas);
    return {
      plate: s.getPropertyValue('--plate').trim() || '#f1f1ee',
      ink: s.getPropertyValue('--ink').trim() || '#1b1b1b',
      accent: s.getPropertyValue('--accent').trim() || '#c2410c',
    };
  }

  // distance from the focus to the nearest point of a square cell
  function dist(x, y, size) {
    const dx = Math.max(x - focus.x, 0, focus.x - (x + size));
    const dy = Math.max(y - focus.y, 0, focus.y - (y + size));
    return Math.hypot(dx, dy);
  }

  function draw() {
    if (!w || !h) return;
    const c = colors();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = c.plate;
    ctx.fillRect(0, 0, w, h);

    // one path per depth, so each level can have its own weight
    const paths = Array.from({ length: MAX_DEPTH + 1 }, () => new Path2D());
    const finest = [];

    const visit = (x, y, size, depth) => {
      if (depth < MAX_DEPTH && dist(x, y, size) < size * REFINE) {
        const s = size / 2;
        visit(x, y, s, depth + 1);
        visit(x + s, y, s, depth + 1);
        visit(x, y + s, s, depth + 1);
        visit(x + s, y + s, s, depth + 1);
      } else {
        paths[depth].rect(x + 0.5, y + 0.5, size, size);
        if (depth === MAX_DEPTH) finest.push([x, y, size]);
      }
    };

    // tile the frame with root cells, then refine each
    const root = h / 2;
    const cols = Math.ceil(w / root);
    const x0 = (w - cols * root) / 2;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < 2; j++) visit(x0 + i * root, j * root, root, 0);

    ctx.lineWidth = 1;
    ctx.strokeStyle = c.ink;
    paths.forEach((p, depth) => {
      ctx.globalAlpha = 0.14 + 0.5 * (depth / MAX_DEPTH);
      ctx.stroke(p);
    });

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.accent;
    for (const [x, y, s] of finest) ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2);
    ctx.globalAlpha = 1;
  }

  // ── animation loop (sleeps when nothing changes) ──────────
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden) return;

    const idle = now - lastInput > IDLE_MS;
    if (idle) {
      const t = now / 1000;
      target.x = w * (0.5 + 0.34 * Math.sin(t * 0.23));
      target.y = h * (0.5 + 0.32 * Math.sin(t * 0.37 + 1.3));
    }
    focus.x += (target.x - focus.x) * EASE;
    focus.y += (target.y - focus.y) * EASE;
    draw();

    const settled = Math.hypot(target.x - focus.x, target.y - focus.y) < 0.3;
    if (idle || !settled) wake();
  }

  function wake() {
    if (reduceMotion || frame) return;
    frame = requestAnimationFrame(tick);
  }

  resize();
  wake();
}
