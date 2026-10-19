import { $, onStopAll } from "./core.js";

/* Mini Alexa (mini_alexa.py) */
const log = $("alexaLog"), aStatus = $("alexaStatus");
const aStart = $("alexaStart"), aStop = $("alexaStop");
let commandMap = {};
fetch("responses.json").then((r) => r.json()).then((j) => { commandMap = j; }).catch(() => { commandMap = {}; });

function addLine(cls, text) {
  const d = document.createElement("div");
  d.className = cls; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  return d;
}
function speak(text) {
  addLine("bot", `Alexa: ${text}`);
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.volume = 1.0;
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let listening = false, recog = null;

function listenOnce() {
  return new Promise((resolve) => {
    recog = new SR();
    recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    let got = "";
    recog.onresult = (e) => { got = e.results[0][0].transcript; };
    recog.onerror = (e) => {
      if (e.error === "not-allowed") { aStatus.textContent = "Microphone permission was blocked."; listening = false; }
      else if (e.error === "network") speak("Sorry, there is a network error.");
    };
    recog.onend = () => resolve(got);
    addLine("sys", "Listening...");
    recog.start();
  });
}

async function wikiLookup(query) {
  const api = "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=" + encodeURIComponent(query);
  const s = await (await fetch(api)).json();
  const hits = s?.query?.search || [];
  for (const h of hits) {
    const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(h.title.replace(/ /g, "_")));
    if (!r.ok) continue;
    const p = await r.json();
    if (p.type === "disambiguation" || !p.extract) continue;
    const sentences = p.extract.match(/[^.!?]+[.!?]+(\s|$)/g) || [p.extract];
    return sentences.slice(0, 2).join("").trim();
  }
  return null;
}

// returns false when the assistant should stop
async function respond(command) {
  if (!command) return true;
  command = command.toLowerCase().trim();
  if (command in commandMap) {
    await speak(commandMap[command]);
  } else if (command.includes("your name")) {
    await speak("I am mini alexa, your voice assistant.");
  } else if (command.includes("who created you")) {
    await speak("Dhyanam created me.");
  } else if (command.includes("time")) {
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    await speak(`The time is ${t}`);
  } else if (command.includes("google")) {
    const w = window.open("https://www.google.com", "_blank");
    if (!w) addLine("sys", "Popup blocked: https://www.google.com");
    await speak("Opening google.");
  } else if (command.includes("who is") || command.includes("tell me about") || command.includes("what is")) {
    const query = command.replace("who is", "").replace("tell me about", "").replace("what is", "").trim();
    try {
      const info = query ? await wikiLookup(query) : null;
      await speak(info || `I could not find anything about ${query}.`);
    } catch (e) {
      console.error("Wikipedia error:", e);
      await speak("I could not find information on that topic.");
    }
  } else if (command.includes("bye")) {
    await speak("Goodbye, have a great day.");
    return false;
  } else if (command.includes("stop")) {
    await speak("Stopping");
    return false;
  } else {
    await speak("Sorry, I don't understand.");
  }
  return true;
}

function setListeningUI(on) {
  aStart.disabled = on; aStop.disabled = !on;
  aStatus.textContent = on ? "Listening for commands… say \"bye\" to stop." : (SR ? "Stopped." : "Voice input isn't supported in this browser: type commands instead.");
}

aStart.onclick = async () => {
  if (!SR) { setListeningUI(false); return; }
  listening = true; setListeningUI(true);
  await speak("Hi, I am Alexa, how can I help you?");
  while (listening) {                    // while True: cmd = listen(); respond(cmd)
    const cmd = await listenOnce();
    if (!listening) break;
    if (cmd) addLine("you", "You said: " + cmd);
    const keepGoing = await respond(cmd);
    if (!keepGoing) listening = false;
  }
  setListeningUI(false);
};
aStop.onclick = () => { listening = false; try { recog?.abort(); } catch {} speechSynthesis.cancel(); setListeningUI(false); };

$("alexaForm").onsubmit = async (e) => {
  e.preventDefault();
  const v = $("alexaInput").value.trim();
  if (!v) return;
  $("alexaInput").value = "";
  addLine("you", "You said: " + v);
  await respond(v);
};
if (!SR) aStatus.textContent = "Voice input isn't supported in this browser: type commands instead.";

onStopAll(() => { if (listening) aStop.onclick(); });
