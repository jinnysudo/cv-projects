// shared helpers: tabs, camera, stop-all registry, pyodide loader
export const $ = (id) => document.getElementById(id);

const stoppers = new Set();
export function onStopAll(fn) { stoppers.add(fn); }
export function stopAll() { stoppers.forEach((fn) => { try { fn(); } catch (e) { console.warn(e); } }); }

export function initTabs() {
  const btns = document.querySelectorAll("#tabs button");
  const show = (name) => {
    btns.forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === name));
  };
  btns.forEach((b) => b.addEventListener("click", () => {
    stopAll();
    show(b.dataset.tab);
    history.replaceState(null, "", "#" + b.dataset.tab);
  }));
  const start = location.hash.slice(1);
  if (start && document.getElementById(start)) show(start);
}

export function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

let pyPromise = null;
export function getPython() {
  if (!pyPromise) {
    pyPromise = (async () => {
      await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      return await window.loadPyodide();
    })();
    pyPromise.catch(() => { pyPromise = null; });
  }
  return pyPromise;
}

// keep a little tk-style message box
export function tkMessage(title, text) { alert(`${title}\n\n${text}`); }
