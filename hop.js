// The rabbit's hop from the VC deck's title slide, redrawn as vector line art: key 1 (crouch), breakdown (top of
// the hop) and key 2 (landing) are the animator's drawings; the two in-betweens are computed between them on
// slow-in/slow-out spacing, ears dragging behind the body. An illustration of the job, not model output.
// Exposes window.Hop = { drawings, render, pose, ARC, VIEWBOX }.
(function () {
  "use strict";
  const D2R = Math.PI / 180;
  const f = (v) => v.toFixed(1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);

  // Angles are world degrees: 0 = right (the way the rabbit hops), 90 = down, -90 = up.
  // rot tilts the body; e1/e2 are the ears; fA/fL front leg; hA/hL hind leg; rx/ry body size.
  const KEY1 = { rot: -30, rx: 44, ry: 27, e1: -100, e2: -84, fA: 92, fL: 30, hA: 100, hL: 6 };
  const BRK = { rot: -4, rx: 56, ry: 22, e1: -172, e2: -162, fA: 24, fL: 26, hA: 172, hL: 26 };
  const KEY2 = { rot: -14, rx: 46, ry: 26, e1: -96, e2: -80, fA: 90, fL: 44, hA: 186, hL: 32 };
  const EARS = ["e1", "e2"];

  function between(A, B, u) {
    const tb = ease(u), te = ease(Math.min(1, Math.max(0, (u - 0.2) / 0.8)));
    const o = {};
    for (const k in A) o[k] = lerp(A[k], B[k], EARS.includes(k) ? te : tb);
    return o;
  }

  // Positions of the five drawings on the hop's arc, in the stage's coordinates.
  const ARC = { x0: 110, x1: 1090, ground: 330, peak: 120 };
  const arcY = (x) => { const u = (x - ARC.x0) / (ARC.x1 - ARC.x0); return ARC.ground - (ARC.ground - ARC.peak) * 4 * u * (1 - u); };

  const drawings = [
    { n: 1, kind: "key", label: "Key", p: KEY1 },
    { n: 3, kind: "ib", label: "In-between", p: between(KEY1, BRK, 0.5) },
    { n: 5, kind: "bd", label: "Breakdown", p: BRK },
    { n: 7, kind: "ib", label: "In-between", p: between(BRK, KEY2, 0.5) },
    { n: 9, kind: "key", label: "Key", p: KEY2 },
  ];
  drawings.forEach((d, i) => { d.x = lerp(ARC.x0, ARC.x1, i / 4); d.y = arcY(d.x) - (i === 0 || i === 4 ? 30 : 0); });

  const rotPt = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const ell = (cx, cy, rx, ry, deg) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(deg)} ${f(cx)} ${f(cy)})"/>`;
  const line = (x, y, deg, len) => `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + Math.cos(deg * D2R) * len)}" y2="${f(y + Math.sin(deg * D2R) * len)}"/>`;

  // Markup for one drawing centred on (0,0); the caller translates it to its spot on the arc.
  function render(p) {
    const a = p.rot * D2R;
    const at = (x, y) => rotPt(x, y, a);
    const [hx, hy] = at(-p.rx * 0.42, p.ry * 0.28), hr = p.ry * 0.82;          // haunch
    const [tx, ty] = at(-p.rx - 5, -p.ry * 0.1);                                // tail
    const [cx, cy] = at(p.rx * 0.95, -p.ry * 0.7), head = 19;                   // head
    const [fx, fy] = at(p.rx * 0.55, p.ry * 0.7);                               // front leg root
    const earRoot = (dx) => [cx + dx, cy - head * 0.7];
    const ear = (dx, deg) => { const [ex, ey] = earRoot(dx); return ell(ex + Math.cos(deg * D2R) * 22, ey + Math.sin(deg * D2R) * 22, 24, 8, deg); };
    return `<g class="rb">` +
      line(hx, hy + hr * 0.85, p.hA, p.hL + hr * 0.2) +
      ear(-2, p.e1) +
      `<circle cx="${f(tx)}" cy="${f(ty)}" r="8"/>` +
      ell(0, 0, p.rx, p.ry, p.rot) +
      `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(hr)}"/>` +
      line(fx, fy, p.fA, p.fL) +
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${head}"/>` +
      ear(6, p.e2) +
      `<circle class="eye" cx="${f(cx + 8)}" cy="${f(cy - 3)}" r="3.2"/>` +
      `</g>`;
  }

  // The dotted path of the hop, through the five drawings.
  const ARC_D = "M110 300 Q600 -90 1090 300";

  // Timing chart under the drawings at height y: keys marked with a circle and stem (as in the deck),
  // in-betweens with a tick, the breakdown with a triangle.
  function chart(y) {
    let s = `<line class="tline" x1="${ARC.x0 - 50}" y1="${y}" x2="${ARC.x1 + 50}" y2="${y}"/>`;
    drawings.forEach((d, i) => {
      const x = d.x;
      const m = d.kind === "key" ? `<circle cx="${x}" cy="${y}" r="6"/><line x1="${x}" y1="${y - 11}" x2="${x}" y2="${y + 11}"/>`
        : d.kind === "bd" ? `<path d="M${x - 7} ${y + 6}L${x} ${y - 7}L${x + 7} ${y + 6}Z"/>`
        : `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}"/>`;
      s += `<g class="mk ${d.kind}" data-i="${i}">${m}<text class="mk-label ${d.kind}" x="${x}" y="${y + 32}">${d.label}</text></g>`;
    });
    return s;
  }

  window.Hop = { drawings, render, between, chart, KEY1, BRK, KEY2, ARC, ARC_D, arcY };
})();
