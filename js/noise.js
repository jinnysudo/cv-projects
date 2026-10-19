import { $, onStopAll } from "./core.js";

/* allinone.py: Classroom Noise Detector */
const DURATION_COOLDOWN = 1500;                 // time.sleep(1.5) after an alert
const statusL = $("nzStatus"), volL = $("nzVolume"), alertL = $("nzAlert");
const thrInput = $("nzThreshold"), thrVal = $("nzThrVal"), logBody = $("nzLog"), shots = $("nzShots");
const startBtn = $("nzStart"), stopBtn = $("nzStop");
let ctx = null, stream = null, raf = 0, analyser = null, buf = null, cooling = false, video = null;
const log = [];

const THRESHOLD = () => Number(thrInput.value);
thrInput.oninput = () => (thrVal.textContent = thrInput.value);

function getVolume(data) {                      // np.linalg.norm(indata) * 10
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.round(Math.sqrt(sum) * 10);
}
function logNoise(volume) {
  const t = new Date().toTimeString().slice(0, 8);
  log.push([t, volume]);
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${t}</td><td>${volume}</td>`;
  logBody.prepend(tr);
}
function captureFaceImage() {
  if (!video || video.readyState < 2) return;
  const c = document.createElement("canvas");
  c.width = video.videoWidth; c.height = video.videoHeight;
  c.getContext("2d").drawImage(video, 0, 0);
  const img = new Image();
  img.src = c.toDataURL("image/jpeg", 0.8);
  img.title = "face_" + new Date().toTimeString().slice(0, 8).replace(/:/g, "") + ".jpg";
  shots.prepend(img);
  while (shots.children.length > 8) shots.lastChild.remove();
}
function alertUser(volume) {
  statusL.textContent = "Status: Noise Detected!"; statusL.style.color = "red";
  alertL.textContent = `🔉 Noise Level: ${volume} dB`;
  captureFaceImage();
}
function resetGui() {
  statusL.textContent = "Status: Monitoring..."; statusL.style.color = "black";
  alertL.textContent = "";
}
function loop() {
  analyser.getFloatTimeDomainData(buf);
  const volume = getVolume(buf);
  volL.textContent = `Volume: ${volume}dB`;
  if (volume > THRESHOLD() && !cooling) {
    logNoise(volume); alertUser(volume);
    cooling = true;
    setTimeout(() => { cooling = false; if (stream) resetGui(); }, DURATION_COOLDOWN);
  }
  raf = requestAnimationFrame(loop);
}

startBtn.onclick = async () => {
  startBtn.disabled = true;
  try {
    const useCam = $("nzCam").checked;
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: useCam ? { width: 640, height: 480 } : false,
    });
    if (useCam) {
      video = document.createElement("video"); video.muted = true; video.playsInline = true;
      video.srcObject = new MediaStream(stream.getVideoTracks()); await video.play();
    }
    ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
    buf = new Float32Array(analyser.fftSize);
    src.connect(analyser);
    resetGui(); stopBtn.disabled = false;
    loop();
  } catch (e) {
    console.error(e); startBtn.disabled = false;
    statusL.textContent = e.name === "NotAllowedError" ? "Mic permission was blocked." : "Couldn't start: " + e.message;
  }
};
function stop() {
  cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null; video = null;
  if (ctx) { ctx.close(); ctx = null; }
  startBtn.disabled = false; stopBtn.disabled = true;
  statusL.textContent = "Status: Stopped"; statusL.style.color = "black"; alertL.textContent = "";
}
stopBtn.onclick = stop;
onStopAll(() => { if (stream) stop(); });

$("nzCsv").onclick = () => {
  const csv = "Time,Volume\r\n" + log.map((r) => r.join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "noise_log.csv"; a.click();
};
