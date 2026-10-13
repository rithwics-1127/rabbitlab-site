// Punch player: plays the artist's drawings at their own exposure timing (24 fps; data-frames per drawing),
// pauses briefly at the end of each loop, and lights up the matching cell in the strip. "Slow motion" plays
// 6x slower so each in-between can be read. Clicking a cell pauses on it. Reduced-motion visitors start paused.
(() => {
  const img = document.getElementById("stage-img"), tag = document.getElementById("stage-tag");
  const btn = document.getElementById("play"), slowBtn = document.getElementById("slow");
  const cells = [...document.querySelectorAll("#strip .cell")];
  if (!img || !cells.length) return;
  const srcs = cells.map(c => c.querySelector("img").src);
  srcs.forEach(s => { const i = new Image(); i.src = s; });
  const FRAME = 1000 / 24;
  let i = 0, timer = null, slow = false;
  const show = k => {
    i = k;
    img.src = srcs[k];
    const c = cells[k], key = c.classList.contains("key");
    tag.textContent = key ? "Key · animator" : "In-between · Rabbit AI's job";
    tag.classList.toggle("tag-ai", !key);
    cells.forEach((x, j) => x.classList.toggle("on", j === k));
  };
  const dur = k => {
    const d = (+cells[k].dataset.frames || 2) * FRAME * (slow ? 6 : 1);
    return k === cells.length - 1 ? d + 900 : k === 0 ? d + 500 : d;
  };
  const tick = () => { show((i + 1) % cells.length); timer = setTimeout(tick, dur(i)); };
  const play = () => { if (!timer) { timer = setTimeout(tick, dur(i)); btn.textContent = "❚❚ Pause"; btn.setAttribute("aria-pressed", "true"); } };
  const pause = () => { clearTimeout(timer); timer = null; btn.textContent = "▶ Play"; btn.setAttribute("aria-pressed", "false"); };
  btn.addEventListener("click", () => (timer ? pause() : play()));
  slowBtn.addEventListener("click", () => {
    slow = !slow; slowBtn.setAttribute("aria-pressed", String(slow));
    slowBtn.textContent = slow ? "Real speed" : "Slow motion";
    if (timer) { pause(); play(); }
  });
  cells.forEach((c, k) => c.addEventListener("click", () => { pause(); show(k); }));
  show(0);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) pause(); else play();
})();
