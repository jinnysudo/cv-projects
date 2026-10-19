import { fingersUp, gestureName } from "./gestures.js";

const MP_VER = "0.10.14";
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const $ = (id) => document.getElementById(id);

/* ---------------- tabs ---------------- */
document.querySelectorAll("#tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("active", x === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === b.dataset.tab));
    stopCamera();
    history.replaceState(null, "", "#" + b.dataset.tab);
  });
});
const startTab = location.hash.slice(1);
if (startTab) document.querySelector(`#tabs button[data-tab="${startTab}"]`)?.click();

/* ---------------- mediapipe (lazy) ---------------- */
let mpLib = null, vision = null;
async function loadVision() {
  if (!mpLib) {
    mpLib = await import(`${MP_URL}/vision_bundle.mjs`);
    vision = await mpLib.FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
  }
  return mpLib;
}
async function createTask(Klass, options) {
  try {
    return await Klass.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: "GPU" } });
  } catch (e) {
    console.warn("GPU failed, using CPU", e);
    return await Klass.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: "CPU" } });
  }
}

/* ---------------- shared camera ---------------- */
const video = document.createElement("video");
video.playsInline = true; video.muted = true;
let stream = null, rafId = 0, activeStop = null;

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
  video.srcObject = stream;
  await video.play();
}
function stopCamera() {
  cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  if (activeStop) { activeStop(); activeStop = null; }
}

function setupVisionDemo({ prefix, makeTask, draw }) {
  const canvas = $(prefix + "Canvas"), ctx = canvas.getContext("2d");
  const startBtn = $(prefix + "Start"), stopBtn = $(prefix + "Stop"), status = $(prefix + "Status");
  let task = null, lastTs = -1;

  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);

  startBtn.onclick = async () => {
    startBtn.disabled = true;
    try {
      stopCamera();
      status.textContent = "Loading model…";
      await loadVision();
      if (!task) task = await makeTask(mpLib);
      status.textContent = "Starting camera…";
      await startCamera();
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      status.textContent = "Running. Press Q or Stop to quit.";
      stopBtn.disabled = false;
      activeStop = () => {
        startBtn.disabled = false; stopBtn.disabled = true;
        status.textContent = "Camera is off.";
      };
      const loop = () => {
        if (!stream) return;
        if (video.readyState >= 2) {
          let ts = performance.now();
          if (ts <= lastTs) ts = lastTs + 1;
          lastTs = ts;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          draw(task, ctx, canvas, ts);
        }
        rafId = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.error(e);
      startBtn.disabled = false;
      status.textContent = e.name === "NotAllowedError"
        ? "Camera permission was blocked. Allow it in the address bar and try again."
        : "Couldn't start: " + (e.message || e);
    }
  };
  stopBtn.onclick = stopCamera;
}

// "q" quits, like cv2.waitKey(1) == ord("q")
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "q" && document.activeElement?.tagName !== "INPUT") stopCamera();
});

/* ---------------- face detection ---------------- */
setupVisionDemo({
  prefix: "face",
  makeTask: (mp) => createTask(mp.FaceDetector, {
    baseOptions: { modelAssetPath: FACE_MODEL },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  }),
  draw: (task, ctx, canvas, ts) => {
    const res = task.detectForVideo(video, ts);
    const faces = res.detections || [];
    if (faces.length > 0) {
      const b = faces[0].boundingBox;            // x, y, w, h = faces[0]
      ctx.strokeStyle = "rgb(0,255,255)";         // (255,255,0) in BGR
      ctx.lineWidth = 2;
      ctx.strokeRect(b.originX, b.originY, b.width, b.height);
    }
  },
});

/* ---------------- hand gestures ---------------- */
setupVisionDemo({
  prefix: "hand",
  makeTask: (mp) => createTask(mp.HandLandmarker, {
    baseOptions: { modelAssetPath: HAND_MODEL },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.3,
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  }),
  draw: (task, ctx, canvas, ts) => {
    const res = task.detectForVideo(video, ts);
    const W = canvas.width, H = canvas.height;
    let gesture = "";
    for (const lm of res.landmarks || []) {
      // skeleton (like mp_drawing.draw_landmarks)
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      for (const c of mpLib.HandLandmarker.HAND_CONNECTIONS) {
        const a = lm[c.start], b = lm[c.end];
        ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
      }
      ctx.fillStyle = "rgb(255,0,0)";
      for (const p of lm) { ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 4, 0, Math.PI * 2); ctx.fill(); }
      gesture = gestureName(fingersUp(lm)) || gesture;
    }
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "rgb(0,255,0)";
    ctx.fillText(`Gesture: ${gesture}`, 10, 40);
  },
});

/* ---------------- mini alexa ---------------- */
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

/* ---------------- stopwatch ---------------- */
let swRunning = false, swElapsed = 0, swStartAt = 0, swTimer = 0;
const swLabel = $("swTime");
const fmt = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
function swTick() {
  const total = swElapsed + (swRunning ? Math.floor((Date.now() - swStartAt) / 1000) : 0);
  swLabel.textContent = fmt(total);
}
$("swStart").onclick = () => {
  if (swRunning) return;
  swRunning = true; swStartAt = Date.now();
  swTimer = setInterval(swTick, 200);
};
$("swStop").onclick = () => {
  if (!swRunning) return;
  swElapsed += Math.floor((Date.now() - swStartAt) / 1000);
  swRunning = false; clearInterval(swTimer); swTick();
};
$("swReset").onclick = () => {
  swRunning = false; clearInterval(swTimer); swElapsed = 0; swTick();
};
