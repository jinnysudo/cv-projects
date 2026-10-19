import { $ } from "./core.js";

/* todolist.py */
const entry = $("todoEntry"), list = $("todoList");
let selected = -1;

function render(items) {
  list.innerHTML = "";
  items.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t;
    if (i === selected) li.className = "sel";
    li.onclick = () => { selected = i; render(items); };
    list.appendChild(li);
  });
  localStorage.setItem("todos", JSON.stringify(items));
}
let items = [];
try { items = JSON.parse(localStorage.getItem("todos") || "[]"); } catch { items = []; }
render(items);

$("todoAdd").onclick = () => { const v = entry.value; if (v === "") return; items.push(v); entry.value = ""; render(items); };
entry.addEventListener("keydown", (e) => { if (e.key === "Enter") $("todoAdd").click(); });
$("todoDelete").onclick = () => { if (selected < 0) return; items.splice(selected, 1); selected = -1; render(items); };
$("todoClear").onclick = () => { items = []; selected = -1; render(items); };
