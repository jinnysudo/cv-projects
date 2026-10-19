# Dhyanam's Python Projects

Computer vision, voice, NLP and desktop apps I built in Python, plus a web version so anyone can try them live.

**Live demo:** https://jinnysudo.github.io/cv-projects/

| Project | Source | What it does |
|---|---|---|
| Face Detection | `python/face_detection.py` | Webcam face detection with an OpenCV Haar cascade, draws a box on the first face |
| Hand Gesture Recognition | `python/hand_gesture.py` | MediaPipe Hands, 21 landmarks per hand, counts raised fingers → Victory / Open Palm / Fist |
| Classroom Noise Detector | `python/allinone.py` | Monitors mic volume, logs loud moments to `noise_log.csv` and snaps a webcam photo on each alert |
| Mini Alexa | `python/mini_alexa.py` | Voice assistant: speech recognition + text-to-speech, time, Google, Wikipedia lookups, custom replies from `responses.json` |
| Sentiment Analyzer | `python/sentiment_analysis.py` | Tkinter app that rates customer reviews Positive / Neutral / Negative with TextBlob |
| Email Classifier | `python/spam.py` | Fetches Gmail over IMAP or reads `.txt` emails, scores keywords and sorts them into Spam / Promotional / Important, exports CSV |
| To-Do List | `python/todolist.py` | Tkinter to-do app: add, delete, clear all |
| Stopwatch | `python/stopwatch.py` | Tkinter stopwatch (HH:MM:SS), also packaged as a Windows .exe with PyInstaller |
| Camera test | `python/opencv.py` | Minimal OpenCV webcam viewer |

## Run the Python versions

```
pip install opencv-python mediapipe pyttsx3 SpeechRecognition pyaudio wikipedia textblob sounddevice numpy
python python/hand_gesture.py
```

Face detection needs `haarcascade_frontalface_default.xml` next to the script (it ships with OpenCV in `cv2.data.haarcascades`). Press **q** to quit the camera windows.

## How the web demo works

- **Real Python in the browser:** the Sentiment Analyzer and Email Classifier run the actual Python code through Pyodide (Python compiled to WebAssembly). Sentiment uses the real TextBlob library; the email classifier executes the `classify_email()` function straight from `spam.py`.
- **Face + hands:** Google MediaPipe Tasks (BlazeFace and Hand Landmarker) running on-device. Finger-counting rules are identical to the Python code (`js/gestures.js`).
- **Noise detector:** Web Audio API, same volume formula (`norm(samples) * 10`), threshold, CSV log and snapshot-on-alert.
- **Mini Alexa:** Web Speech API + Wikipedia's public API, same command order as the Python version.
- **To-Do List / Stopwatch:** same layout and logic as the Tkinter windows.

Camera and microphone never leave your device. Voice input works best in Chrome or Edge.

## AI usage

The Python projects are my own work. The JavaScript web port was made with help from an AI assistant.
