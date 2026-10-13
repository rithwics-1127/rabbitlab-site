// "Flip it": plays key → in-between → key → in-between like a flipbook, the way animators check motion.
(() => {
  const btn = document.getElementById("play");
  const panels = [...document.querySelectorAll(".panel")];
  if (!btn || panels.length !== 3) return;
  const order = [0, 1, 2, 1];
  let timer = null, i = 0;
  const stop = () => {
    clearInterval(timer); timer = null;
    document.body.classList.remove("flipping");
    panels.forEach(p => p.classList.remove("on"));
    btn.textContent = "▶ Flip it"; btn.setAttribute("aria-pressed", "false");
  };
  btn.addEventListener("click", () => {
    if (timer) return stop();
    document.body.classList.add("flipping");
    btn.textContent = "■ Stop"; btn.setAttribute("aria-pressed", "true");
    const step = () => { panels.forEach((p, k) => p.classList.toggle("on", k === order[i % 4])); i++; };
    step(); timer = setInterval(step, 260);
  });
})();
