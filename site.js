/* Shared header, footer and renderers. Content lives in data.js. */

const NAV = [
  ["index.html", "Home"],
  ["research.html", "Research"],
  ["publications.html", "Publications"],
  ["news.html", "News"],
  ["about.html", "About"],
];

const SCHOLAR = "https://scholar.google.com/citations?user=6NaASxIAAAAJ&hl=en";
const EMAIL = "chu.li@northwestern.edu";
const RESEARCHGATE = "https://www.researchgate.net/profile/Chu-Li-6";

function renderHeader() {
  const here = location.pathname.split("/").pop() || "index.html";
  const links = NAV.map(([href, label]) =>
    `<a href="${href}"${href === here ? ' class="active"' : ""}>${label}</a>`).join("");
  document.getElementById("site-header").innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">
        <span class="brand-mark" aria-hidden="true">
          <img src="images/logo.svg" alt="" width="46" height="46">
        </span>
        <span class="brand-text">Chu Li<small>Northwestern University · Chemistry</small></span>
      </a>
      <button class="menu-btn" aria-label="Toggle navigation" onclick="document.body.classList.toggle('menu-open')">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav">${links}</nav>
    </div>`;
}

function renderFooter() {
  document.getElementById("site-footer").innerHTML = `
    <div class="footer-inner">
      <div>© ${new Date().getFullYear()} Chu Li · Department of Chemistry, Northwestern University, Evanston, IL 60208</div>
      <div class="footer-icons">
        <a href="mailto:${EMAIL}" title="Email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>
        <a href="${SCHOLAR}" title="Google Scholar" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm-6 9.18v4L12 20l6-3.82v-4L12 16l-6-3.82z"/></svg></a>
        <a href="${RESEARCHGATE}" title="ResearchGate" target="_blank" rel="noopener" class="rg-icon">R<sup>G</sup></a>
      </div>
    </div>`;
}

/* ---------- News ---------- */
function renderNews(el, limit) {
  const items = limit ? NEWS.slice(0, limit) : NEWS;
  el.innerHTML = items.map(n =>
    `<li><span class="news-date">${n.date}</span><span class="news-text">${n.text}</span></li>`).join("");
}

/* ---------- Publications ---------- */
const bold = s => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

function pubFigure(p, d) {
  const c = THEMES[p.themes[0]].color;
  const ph = `<div class="pub-ph" style="--grad:linear-gradient(135deg,${c},#2a1650)">${artSVG(p.n * 7)}
    <span>${p.venue || "Manuscript"}${p.year ? " · " + p.year : ""}</span></div>`;
  if (!d.fig) return `<div class="pub-fig">${ph}</div>`;
  return `<div class="pub-fig">
    <a href="${d.fig}" target="_blank" rel="noopener"><img src="${d.fig}" alt="Figure from: ${p.title}" loading="lazy"
      onerror="this.closest('.pub-fig').classList.add('missing')"></a>${ph}</div>`;
}

function pubHTML(p, num = p.n) {
  const d = { ...((typeof DETAILS !== "undefined" && DETAILS[p.n]) || {}) };
  const f = typeof FIGS !== "undefined" && FIGS[p.n];
  if (f) d.fig = f;
  const href = p.link || (d.doi && "https://doi.org/" + d.doi);
  const title = href ? `<a href="${href}" target="_blank" rel="noopener">${p.title}</a>` : p.title;
  const venue = p.venue ? ` <i>${p.venue}</i>${p.detail ? " " + p.detail : ""}${p.year ? ` (${p.year})` : ""}.` : "";
  const status = p.status === "review" ? '<span class="pill pill-status">UNDER REVIEW</span>'
               : p.status === "press" ? '<span class="pill pill-status">IN PRESS</span>' : "";
  const tags = p.themes.map(t =>
    `<span class="pill" style="--c:${THEMES[t].color}" data-theme="${t}">${THEMES[t].label}</span>`).join("");
  return `<li data-themes="${p.themes.join(" ")}">
    <span class="pub-n">[${num}]</span>
    ${pubFigure(p, d)}
    <div><span class="pub-title">${title}</span>
      <div class="pub-authors">${bold(p.authors)}</div>
      <div class="pub-venue">${venue.trim()}</div>
      ${d.summary ? `<p class="pub-summary">${d.summary}</p>` : ""}
      <div class="pub-tags">${status}${tags}${d.doi ? `<a class="pub-doi" href="https://doi.org/${d.doi}" target="_blank" rel="noopener">DOI: ${d.doi}</a>` : ""}</div></div></li>`;
}

function renderPubs(el, { selectedOnly = false, excludeSelected = false, byYear = false } = {}) {
  const shown = PUBS.filter(p => p.status !== "review" || SHOW_UNDER_REVIEW);
  // newest first; papers without a year (in review) go on top; ties keep their order in data.js
  const sorted = shown.map((p, i) => [p, i])
    .sort((a, b) => (Number(b[0].year) || 9999) - (Number(a[0].year) || 9999) || a[1] - b[1])
    .map(([p]) => p);
  const list = selectedOnly ? sorted.filter(p => p.selected)
             : excludeSelected ? sorted.filter(p => !p.selected) : sorted;
  // selected papers continue the numbering above the other papers
  const offset = selectedOnly ? sorted.filter(p => !p.selected).length : 0;
  let lastYear = null;
  el.innerHTML = list.map((p, i) => {
    let head = "";
    if (byYear && p.year !== lastYear) {
      head = `<li class="year-head">${p.year || "Under review"}</li>`;
      lastYear = p.year;
    }
    return head + pubHTML(p, offset + list.length - i);
  }).join("");
}

function renderThemeFilter(el, listEl) {
  let active = null;
  el.innerHTML = Object.entries(THEMES).map(([k, t]) =>
    `<button class="pill" style="--c:${t.color}" data-theme="${k}">${t.label}</button>`).join("");
  const apply = () => {
    el.querySelectorAll("button").forEach(b => {
      b.classList.toggle("dim", !!active && b.dataset.theme !== active);
      b.classList.toggle("on", b.dataset.theme === active);
    });
    listEl.querySelectorAll("li[data-themes]").forEach(li =>
      li.hidden = active && !li.dataset.themes.split(" ").includes(active));
    // hide a section heading (e.g. "Selected Publications") whose list has no matching papers
    listEl.querySelectorAll("ol.pubs").forEach(ol => {
      const h = ol.previousElementSibling;
      if (h && h.tagName === "H2") h.hidden = ![...ol.querySelectorAll("li[data-themes]")].some(li => !li.hidden);
    });
    // hide a year heading when none of its papers match the filter
    listEl.querySelectorAll("li.year-head").forEach(h => {
      let n = h.nextElementSibling, any = false;
      while (n && !n.classList.contains("year-head")) { if (!n.hidden) any = true; n = n.nextElementSibling; }
      h.hidden = !any;
    });
  };
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    active = active === b.dataset.theme ? null : b.dataset.theme; apply();
  });
  // clicking a tag on a paper also filters
  listEl.addEventListener("click", e => {
    const s = e.target.closest(".pill[data-theme]"); if (!s) return;
    active = s.dataset.theme; apply(); (el.closest(".filter") || el).scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* ---------- Carousel ---------- */
function initCarousel(root) {
  const slides = [...root.querySelectorAll(".slide")];
  const dots = root.querySelector(".dots");
  let i = 0, timer;
  dots.innerHTML = slides.map((_, k) => `<button aria-label="Slide ${k + 1}"></button>`).join("");
  const show = k => {
    i = (k + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle("on", j === i));
    [...dots.children].forEach((d, j) => d.classList.toggle("on", j === i));
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 6000); };
  root.querySelector(".prev").onclick = () => { show(i - 1); restart(); };
  root.querySelector(".next").onclick = () => { show(i + 1); restart(); };
  [...dots.children].forEach((d, k) => d.onclick = () => { show(k); restart(); });
  show(0); restart();
}

/* ---------- Decorative molecular-network art (placeholder until you add figures) ---------- */
function artSVG(seed) {
  let s = seed * 9301 + 49297;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const W = 800, H = 400, step = 70, pts = [];
  for (let y = -20, r = 0; y < H + 40; y += step * 0.86, r++)
    for (let x = (r % 2) * step / 2 - 20; x < W + 40; x += step)
      if (rnd() > 0.28) pts.push([x + (rnd() - .5) * 26, y + (rnd() - .5) * 26, 2 + rnd() * 5]);
  let bonds = "";
  pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (d < step * 1.15) bonds += `<line x1="${a[0]|0}" y1="${a[1]|0}" x2="${b[0]|0}" y2="${b[1]|0}" stroke-opacity="${(1.2 - d / step / 1.15).toFixed(2)}"/>`;
  }));
  const atoms = pts.map(p => `<circle cx="${p[0]|0}" cy="${p[1]|0}" r="${p[2].toFixed(1)}"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g stroke="#fff" stroke-width="1.4">${bonds}</g><g fill="#fff">${atoms}</g></svg>`;
}
document.querySelectorAll("[data-art]").forEach(el =>
  el.insertAdjacentHTML("afterbegin", artSVG(+el.dataset.art)));

/* ---------- Fade-in on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

renderHeader();
renderFooter();
