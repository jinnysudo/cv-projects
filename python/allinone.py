import tkinter as tk # Imports the tkinter library for GUI.
import numpy as np  # Imports the numpy library for numerical functions.
from tkinter import messagebox # Imprts the messagebox module of tkinter so as to add messageboxes to the GUI.
import csv # Imports the csv library for csv manipulation and logging.
import time # Imports the time library for adding sleep durations in the code.
import sounddevice as sd # Imports the sounddevice library for accessing mic and detecting the audio level.
import threading # Imports the threading library to thread together different processes as many processes are going together at the same time.
import cv2 # Imports the opencv library for camera usage and photo functionality.

THRESHOLD=10 # Sets the minimum decibel threshold as 10 DB.
CSV_LOG = "noise_log.csv" # Sets the log file to be nosie_log.csv.
DURATION= 1 # Sets duration between subsequent audio measurement to be 1 second.

with open(CSV_LOG, "w", newline="") as file: # Opens the csv log file in write mode.
    writer = csv.writer(file) 
    writer.writerow(["Time", "Volume"])

root = tk.Tk()
root.title("Classroom Noise Detector")
root.geometry("400x200")
root.configure(bg="white")

status_label = tk.Label(root, text="Status: Monitoring...", font=("Arial", 14), bg="white")
status_label.pack(pady=20)
volume_label = tk.Label(root, text="Volume: 0dB", font=("Arial", 12), bg="white")
volume_label.pack(pady=10)
alert_label = tk.Label(root, text="", font=("Arial", 16, "bold"), fg="red", bg="white")
alert_label.pack(pady=10)

def get_volume(indata):
    volume_norm = np.linalg.norm(indata)*10
    return int(volume_norm)

def log_noise(volume):
    with open(CSV_LOG, "a", newline='') as file:
        writer = csv.writer(file)
        writer.writerow([time.strftime("%H:%M:%S"), volume])

def capture_face_image():
    cap = cv2.VideoCapture(0)
    ret,frame = cap.read()
    if ret:
        timestamp = time.strftime("%H%M%S")
        filename = f"face_{timestamp}.jpg"
        cv2.imwrite(filename, frame)
    cap.release()

def alert_user(volume):
    status_label.config(text="Status: Noise Detected!", fg="red")
    alert_label.config(text=f"🔉 Noise Level: {volume} dB")
    root.update()
    capture_face_image()

def reset_gui():
    status_label.config(text="Status: Monitoring...", fg="black")
    alert_label.config(text="")
    root.update()

def audio_callback(indata, frames, time_info, status):
    volume = get_volume(indata)
    volume_label.config(text=f"Volume: {volume} dB")
    if volume> THRESHOLD:
        log_noise(volume)
        alert_user(volume)
        time.sleep(1.5)
        reset_gui()

def start_monitoring():
    with sd.InputStream(callback=audio_callback):
        while True:
            time.sleep(DURATION)

def run_monitoring():
    monitor_thread = threading.Thread(target=start_monitoring)
    monitor_thread.daemon = True
    monitor_thread.start()

run_monitoring()
root.mainloop()
