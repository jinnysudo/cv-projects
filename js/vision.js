import { $, onStopAll } from "./core.js";
import { fingersUp, gestureName } from "./gestures.js";

const MP_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let mpLib = null, vision = null;
async function loadVision() {
  if (!mpLib) {
    const lib = await import(`${MP_URL}/vision_bundle.mjs`);
    vision = await lib.FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
    mpLib = lib;
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

const video = document.createElement("video");
video.playsInline = true; video.muted = true;
let stream = null, rafId = 0, activeStop = null;

function stopCamera() {
  cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  if (activeStop) { activeStop(); activeStop = null; }
}
onStopAll(stopCamera);

// "q" quits, like cv2.waitKey(1) == ord("q")
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (e.key.toLowerCase() === "q" && tag !== "INPUT" && tag !== "TEXTAREA") stopCamera();
});

function setupDemo({ prefix, makeTask, draw }) {
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
      if (!task && makeTask) task = await makeTask(mpLib);
      status.textContent = "Starting camera…";
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      video.srcObject = stream;
      await video.play();
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      status.textContent = "Running. Press Q or Stop to quit.";
      stopBtn.disabled = false;
      activeStop = () => { startBtn.disabled = false; stopBtn.disabled = true; status.textContent = "Camera is off."; };
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

/* face detection (face_detection.py) */
setupDemo({
  prefix: "face",
  makeTask: (mp) => createTask(mp.FaceDetector, {
    baseOptions: { modelAssetPath: FACE_MODEL }, runningMode: "VIDEO", minDetectionConfidence: 0.5,
  }),
  draw: (task, ctx, canvas, ts) => {
    const faces = task.detectForVideo(video, ts).detections || [];
    if (faces.length > 0) {
      const b = faces[0].boundingBox;          // x, y, w, h = faces[0]
      ctx.strokeStyle = "rgb(0,255,255)";       // (255,255,0) in BGR
      ctx.lineWidth = 2;
      ctx.strokeRect(b.originX, b.originY, b.width, b.height);
    }
  },
});

/* hand gestures (hand_gesture.py) */
setupDemo({
  prefix: "hand",
  makeTask: (mp) => createTask(mp.HandLandmarker, {
    baseOptions: { modelAssetPath: HAND_MODEL }, runningMode: "VIDEO", numHands: 2,
    minHandDetectionConfidence: 0.3, minHandPresenceConfidence: 0.3, minTrackingConfidence: 0.3,
  }),
  draw: (task, ctx, canvas, ts) => {
    const res = task.detectForVideo(video, ts);
    const W = canvas.width, H = canvas.height;
    let gesture = "";
    for (const lm of res.landmarks || []) {
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
