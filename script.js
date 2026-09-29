const panels = [...document.querySelectorAll("[data-panel]")];
const navItems = [...document.querySelectorAll("[data-view]")];
const viewLabel = document.getElementById("view-label");
const viewMeta = document.getElementById("view-meta");
const guideNav = document.getElementById("guide-nav");
const menuToggle = document.getElementById("menu-toggle");
const themeToggle = document.getElementById("theme-toggle");
const metaByView = {
  overview: ["Control room", "Core model loaded"],
  workflow: ["Engineering loop", "Sequence ready"],
  glossary: ["Reference bay", "10 terms indexed"],
  "work-orders": ["Work orders", "4 templates ready"],
  verification: ["Verification", "Checklist available"],
};

function viewFromHash() {
  const value = window.location.hash.slice(1);
  return metaByView[value] ? value : "overview";
}

function navigate(view, updateHistory = true) {
  const nextView = metaByView[view] ? view : "overview";
  panels.forEach((panel) => {
    const active = panel.dataset.panel === nextView;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  navItems.forEach((item) => {
    const active = item.dataset.view === nextView;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const [label, meta] = metaByView[nextView];
  viewLabel.textContent = label;
  viewMeta.textContent = meta;
  document.title = `${label} · Codex Field Guide`;
  document.body.dataset.view = nextView;
  if (updateHistory && window.location.hash !== `#${nextView}`) window.history.pushState({}, "", `#${nextView}`);
  guideNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  if (updateHistory) document.getElementById("main-content").focus({ preventScroll: true });
}

navItems.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.view)));
window.addEventListener("hashchange", () => navigate(viewFromHash(), false));
window.addEventListener("popstate", () => navigate(viewFromHash(), false));

menuToggle.addEventListener("click", () => {
  const open = guideNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close guide navigation" : "Open guide navigation");
});

const storedTheme = localStorage.getItem("codex-theme");
const setTheme = (theme) => {
  const light = theme === "light";
  document.documentElement.dataset.theme = light ? "light" : "dark";
  themeToggle.setAttribute("aria-pressed", String(light));
  themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
  themeToggle.querySelector(".theme-icon").textContent = light ? "☀" : "☾";
  themeToggle.querySelector(".theme-label").textContent = light ? "Light" : "Dark";
  localStorage.setItem("codex-theme", light ? "light" : "dark");
};
setTheme(storedTheme === "light" ? "light" : "dark");
themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

const glossarySearch = document.getElementById("glossary-search");
const glossaryTerms = [...document.querySelectorAll("#glossary-terms details")];
const glossaryEmpty = document.getElementById("glossary-empty");
glossarySearch.addEventListener("input", () => {
  const query = glossarySearch.value.trim().toLowerCase();
  let visible = 0;
  glossaryTerms.forEach((term) => {
    const matches = !query || `${term.dataset.key} ${term.textContent}`.toLowerCase().includes(query);
    term.hidden = !matches;
    if (matches) visible += 1;
  });
  glossaryEmpty.hidden = visible !== 0;
});

const toast = document.getElementById("toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(source.textContent);
      button.textContent = "Copied";
      showToast("Work order copied to clipboard");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = source.textContent;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      button.textContent = "Copied";
      showToast("Work order copied to clipboard");
    }
    setTimeout(() => { button.textContent = original; }, 1500);
  });
});

const quickDialog = document.getElementById("quick-start-dialog");
document.getElementById("open-quick-start").addEventListener("click", () => quickDialog.showModal());
document.querySelector(".dialog-close").addEventListener("click", () => quickDialog.close());
document.querySelector("[data-dialog-close]").addEventListener("click", () => {
  quickDialog.close();
  navigate("work-orders");
});
quickDialog.addEventListener("click", (event) => {
  if (event.target === quickDialog) quickDialog.close();
});

navigate(viewFromHash(), false);
