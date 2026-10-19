# Dhyanam's CV Projects

Computer-vision and voice projects I built in Python, plus a web port so anyone can try them live.

**Live demo:** https://jinnysudo.github.io/cv-projects/

| Project | Python original | What it does |
|---|---|---|
| Face Detection | `python/face_detection.py` | Webcam face detection with an OpenCV Haar cascade, draws a box on the first face |
| Hand Gesture Recognition | `python/hand_gesture.py` | MediaPipe Hands, 21 landmarks per hand, counts raised fingers → Victory / Open Palm / Fist |
| Mini Alexa | `python/mini_alexa.py` | Voice assistant: speech recognition + text-to-speech, time, Google, Wikipedia lookups, custom replies from `responses.json` |
| Stopwatch | `python/stopwatch.py` | Tkinter stopwatch (HH:MM:SS, start / stop / reset), also packaged as a Windows .exe with PyInstaller |

## Run the Python versions

```
pip install opencv-python mediapipe pyttsx3 SpeechRecognition pyaudio wikipedia
python python/hand_gesture.py
```

Face detection needs `haarcascade_frontalface_default.xml` next to the script (it ships with OpenCV in `cv2.data.haarcascades`). Press **q** to quit the camera windows.

## How the web demo works

Browsers can't run OpenCV/pyttsx3 Python directly, so the web version ports the same logic to JavaScript:

- Face + hands: Google MediaPipe Tasks (BlazeFace and Hand Landmarker) running on-device in WebAssembly. The finger-counting rules are identical to the Python code (`gestures.js`).
- Mini Alexa: Web Speech API for listening and speaking, Wikipedia's public API for lookups. Same command order as the Python version.
- Stopwatch: same layout as the Tkinter window.

Camera and microphone never leave your device. Voice input works best in Chrome or Edge.

## AI usage

The Python projects are my own work.
