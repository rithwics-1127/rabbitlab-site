/* Site settings. Change these two lines to rename the company or set the contact email.
   For search engines and no-JS visitors, also find-and-replace the same text in
   index.html (see README, "Replace the placeholders"). */
const BRAND = "Rabbit AI";
const EMAIL = "hello@rabbitlab.ai"; // needs a working mailbox or forwarding

const initSite = () => {
  /* ---------- settings ---------- */
  document.querySelectorAll("[data-brand]").forEach((el) => { el.textContent = BRAND; });
  document.querySelectorAll("[data-brand-label]").forEach((el) => {
    el.setAttribute("aria-label", BRAND + ", back to top");
  });
  document.title = document.title.replace("Rabbit AI", BRAND);
  document.querySelectorAll("[data-email]").forEach((el) => { el.textContent = EMAIL; });
  document.querySelectorAll("[data-mailto]").forEach((el) => {
    el.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(el.dataset.mailto);
  });
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- motion (illustrations only; everything is readable without it) ---------- */
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onScreen = (el, cb, margin) => {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin || "0px" }).observe(el);
  };

  /* deterministic pseudo-random hex for the illustrative hashes */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hex = (n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");

  /* IMU trace: two scrolling motion channels drawn on a canvas */
  const cv = document.querySelector("[data-imu]");
  if (cv) {
    const ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const C_A = css.getPropertyValue("--dim").trim() || "#A9B3B0";
    const C_B = css.getPropertyValue("--ok").trim() || "#4BE3A0";
    const C_G = css.getPropertyValue("--line").trim() || "#1C2224";
    let w = 0, h = 0, t = 0, visible = true, raf = 0;
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const sig = (x, k) => {
      // sum of sines with a slow "step" rhythm, like a walking wearer
      const s = x * 0.045 + k * 3.1;
      return 0.55 * Math.sin(s) + 0.28 * Math.sin(s * 2.7 + k) + 0.14 * Math.sin(s * 7.3 + 2 * k) + 0.08 * Math.sin(s * 13.1);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = C_G; ctx.lineWidth = 1;
      for (let gx = 0; gx <= w; gx += Math.max(24, w / 15)) { ctx.beginPath(); ctx.moveTo(Math.round(gx) + .5, 0); ctx.lineTo(Math.round(gx) + .5, h); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, h / 2 + .5); ctx.lineTo(w, h / 2 + .5); ctx.stroke();
      [[C_A, 0, 0.30], [C_B, 1, 0.22]].forEach(([c, k, amp]) => {
        ctx.strokeStyle = c; ctx.lineWidth = 1.25; ctx.globalAlpha = k ? 0.95 : 0.6; ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const v = sig(x + t, k);
          const yy = h / 2 - v * h * amp * (k ? 1 : 1.25) + (k ? h * 0.12 : -h * 0.08);
          x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };
    const loop = () => { t += 1.4; draw(); raf = visible ? requestAnimationFrame(loop) : 0; };
    size(); draw();
    window.addEventListener("resize", () => { size(); draw(); });
    if (!REDUCED) {
      onScreen(cv, (v) => { visible = v && !document.hidden; if (visible && !raf) raf = requestAnimationFrame(loop); });
      document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible && !raf) raf = requestAnimationFrame(loop); });
    }
  }

  /* Live chain: a new 2 s segment arrives, gets signed, older ones scroll off */
  const chain = document.querySelector("[data-live-chain]");
  if (chain) (() => {
    const log = document.querySelector("[data-log]");
    const count = document.querySelector("[data-count]");
    const tc = document.querySelector("[data-tc]");
    let seq = chain.querySelectorAll(".blk.ok").length; // next segment number
    let prev = "9b2e…44", running = false, timer = 0;
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (s) => pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
    const fit = () => {
      // drop the oldest segments that no longer fit beside GEN
      const blocks = [...chain.querySelectorAll(".blk:not(.gen):not(.gone)")];
      const room = chain.clientWidth;
      const gap = parseFloat(getComputedStyle(chain).columnGap) || 8;
      const used = chain.querySelector(".gen").offsetWidth + gap;
      const step = (blocks[0] ? blocks[0].offsetWidth : 34) + gap;
      const max = Math.max(3, Math.floor((room - used) / step));
      blocks.slice(0, Math.max(0, blocks.length - max)).forEach((b) => {
        b.classList.add("gone");
        setTimeout(() => b.remove(), 360);
      });
    };
    const tick = () => {
      const b = document.createElement("span");
      b.className = "blk pending in";
      b.textContent = String(seq);
      chain.appendChild(b);
      fit();
      const n = seq;
      setTimeout(() => {
        b.className = "blk ok";
        const h = hex(4) + "…" + hex(2);
        if (log) log.innerHTML = "seg " + String(n).padStart(4, "0") + " · " + h + " ← " + prev + " · <b>signed</b>";
        prev = h;
        if (count) count.textContent = String(n + 1);
        if (tc) tc.textContent = fmt((n + 1) * 2);
      }, 650);
      seq += 1;
      if (seq > 9999) seq = 12;
    };
    fit();
    window.addEventListener("resize", fit);
    if (REDUCED) return; // static, trimmed chain; no ticking
    const start = () => { if (!running) { running = true; timer = setInterval(tick, 1300); } };
    const stop = () => { running = false; clearInterval(timer); };
    onScreen(chain, (v) => (v && !document.hidden ? start() : stop()));
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  })();

  /* Verifier panels: play once when scrolled into view (only if they start off screen) */
  document.querySelectorAll("[data-viz]").forEach((p) => {
    p.querySelectorAll(".vchain .blk").forEach((b, i) => { b.style.transitionDelay = (i * 70) + "ms"; });
    if (REDUCED) return;
    const r = p.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: keep the finished state
    p.classList.add("pre");
    let done = false;
    onScreen(p, (v) => {
      if (v && !done) { done = true; requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove("pre"))); }
    }, "0px 0px -20% 0px");
  });
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSite);
else initSite();
