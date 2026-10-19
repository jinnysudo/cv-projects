import { $, getPython, tkMessage } from "./core.js";

/* spam.py: runs your real classify_email() Python code via Pyodide */
const SAMPLES = [
  ["sample_1_Lottery.txt", "From: Prize Dept <winner@lucky-draw.biz>\n\nCONGRATULATIONS!!! You are the WINNER of our lottery. Claim your FREE cash prize now, act now, this is urgent! Click here to claim your money!!!"],
  ["sample_2_Big_Sale.txt", "From: ShopMart <deals@shopmart.com>\n\nOur festive sale is live! Get an exclusive discount on every order, use the coupon SAVE20 for a special offer. Shop the clearance deals before they're gone."],
  ["sample_3_Project_Meeting.txt", "From: Priya (Client) <priya@acme.co>\n\nHi, can we schedule a meeting tomorrow to review the project report? The proposal deadline is Friday and the invoice for last month's payment is attached. Please follow up."],
  ["sample_4_Short_Link.txt", "From: noreply@links.io\n\nsee this www.example.com"],
];

let files = SAMPLES.map(([name, text]) => ({ name, text }));
let index = 0, classify = null;

const title = $("emTitle"), body = $("emBody"), result = $("emResult"), matches = $("emMatches"), status = $("emStatus");

async function getClassifier() {
  if (classify) return classify;
  status.textContent = "Status: Loading Python…";
  const py = await getPython();
  const src = await (await fetch("python/spam.py")).text();
  // keep only the rules + classify_email() part of spam.py (no tkinter / imaplib in the browser)
  const rules = src.split("def get_gmail_credentials")[0]
    .split("\n").filter((l) => !/^\s*(import|from)\s/.test(l)).join("\n");
  py.runPython("import re\n" + rules);
  classify = (text) => py.globals.get("classify_email")(text).toJs({ dict_converter: Object.fromEntries });
  return classify;
}

function show() {
  if (!files.length) { title.textContent = "No file loaded"; body.textContent = ""; status.textContent = "Status: No .txt files found"; return; }
  const f = files[index];
  title.textContent = `[${index + 1}/${files.length}] ${f.name}`;
  body.textContent = f.text;
  result.textContent = "Result: N/A"; matches.textContent = "Matches: N/A";
  status.textContent = `Status: Ready - Viewing ${f.name}`;
}
const j = (a) => (a && a.length ? a.join(", ") : "-");

$("emPrev").onclick = () => { if (index > 0) { index--; show(); } else tkMessage("Start", "This is the first file."); };
$("emNext").onclick = () => { if (index < files.length - 1) { index++; show(); } else tkMessage("End", "No more files."); };
$("emShuffle").onclick = () => {
  for (let i = files.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [files[i], files[k]] = [files[k], files[i]]; }
  index = 0; show();
};
$("emClassify").onclick = async () => {
  if (!files.length) return tkMessage("No files detected", "No emails loaded to classify.");
  try {
    const res = (await getClassifier())(files[index].text);
    const s = res.scores;
    result.textContent = `Result: ${res.label} (spam:${s.spam_score}, promo:${s.promo_score}, important:${s.important_score})`;
    result.className = "em-" + res.label.toLowerCase();
    matches.textContent = `Matches: spam: ${j(res.spam_matches)} | promo: ${j(res.promo_matches)} | important: ${j(res.important_matches)}`;
    status.textContent = `Status: Classified ${files[index].name} as ${res.label}`;
  } catch (e) { console.error(e); status.textContent = "Status: Python error: " + e.message; }
};
$("emLoad").onchange = async (e) => {
  const picked = [...e.target.files].filter((f) => f.name.toLowerCase().endsWith(".txt"));
  const loaded = [];
  for (const f of picked.sort((a, b) => a.name.localeCompare(b.name))) {
    const t = await f.text();
    if (t.trim()) loaded.push({ name: f.name, text: t });
  }
  if (loaded.length) { files = loaded; index = 0; show(); status.textContent = `Status: Loaded ${files.length} files`; }
};
$("emSamples").onclick = () => { files = SAMPLES.map(([name, text]) => ({ name, text })); index = 0; show(); };
$("emSave").onclick = async () => {
  if (!files.length) return tkMessage("No Files", "No email files found to export.");
  const c = await getClassifier();
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["filename", "label", "spam_matches", "promo_matches", "important_matches", "spam_score", "promo_score", "important_score"]];
  for (const f of files) {
    const r = c(f.text);
    rows.push([f.name, r.label, r.spam_matches.join(";"), r.promo_matches.join(";"), r.important_matches.join(";"), r.scores.spam_score, r.scores.promo_score, r.scores.important_score]);
  }
  const blob = new Blob(["\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "classification_results.csv"; a.click();
  status.textContent = `Status: Saved ${files.length} results to CSV`;
};
show();
