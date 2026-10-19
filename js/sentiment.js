import { $, getPython } from "./core.js";

/* sentiment_analysis.py: real TextBlob running in the browser via Pyodide */
const btn = $("sentBtn"), out = $("sentOut"), input = $("sentInput"), status = $("sentStatus");
let ready = null;

async function setup() {
  status.textContent = "Loading Python + TextBlob (first time takes ~15s)…";
  const py = await getPython();
  // NLTK (used by TextBlob) imports these stdlib modules, which Pyodide ships separately
  await py.loadPackage(["micropip", "regex", "sqlite3", "ssl", "lzma", "hashlib", "pydoc_data"], { errorCallback: console.warn });
  const micropip = py.pyimport("micropip");
  await micropip.install("textblob");
  py.runPython(`
from textblob import TextBlob

def analyze_sentiment(review):
    review = review.strip()
    if review:
        blob = TextBlob(review)
        polarity = blob.sentiment.polarity
        if polarity > 0.2:
            result = "😊 Positive"
        elif polarity < -0.1:
            result = "😠 Negative"
        else:
            result = "😑 Neutral"
        return f"Sentiment: {result}", round(polarity, 3), True
    return "Please enter a review.", None, False
`);
  status.textContent = "Python ready: this is the real TextBlob library.";
  return py.globals.get("analyze_sentiment");
}

btn.onclick = async () => {
  btn.disabled = true;
  try {
    if (!ready) ready = setup();
    const analyze = await ready;
    const [text, polarity, big] = analyze(input.value).toJs();
    out.textContent = text;
    out.style.font = big ? "bold 19px Arial, sans-serif" : "16px Arial, sans-serif";
    status.textContent = polarity === null ? "" : `TextBlob polarity: ${polarity}`;
  } catch (e) {
    console.error(e); ready = null;
    const msg = String(e.message || e).trim().split("\n");
    status.textContent = "Couldn't load Python: " + msg.slice(-2).join(" ").slice(-300);
  }
  btn.disabled = false;
};
