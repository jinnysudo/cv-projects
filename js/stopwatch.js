import { $ } from "./core.js";

/* stopwatch.py: data = [running, start_time, elapsed] */
const data = [false, 0.0, 0.0];
const label = $("swTime");
const now = () => Date.now() / 1000;

function updateTime() {
  if (data[0] === true) {
    const elapsed = data[2] + (now() - data[1]);
    const seconds = Math.floor(elapsed);
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    label.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    setTimeout(updateTime, 100);                 // root.after(100, update_time)
  }
}
$("swStart").onclick = () => { if (data[0] === false) { data[0] = true; data[1] = now(); updateTime(); } };
$("swStop").onclick = () => { if (data[0] === true) { data[2] = data[2] + now() - data[1]; data[0] = false; } };
$("swReset").onclick = () => { data[0] = false; data[1] = 0.0; data[2] = 0.0; label.textContent = "00:00:00"; };
