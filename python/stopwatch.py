import tkinter as tk
import time

root = tk.Tk()
root.title("Stopwatch")
root.geometry("300x300")
root.resizable(False,False)


heading_label = tk.Label(root, text="StopWatch", font=("Arial", 16))
heading_label.pack(pady=15)
label = tk.Label(root, text="00:00:00", font=("Arial", 32, "bold"))
label.pack(pady=12)

data = [False, 0.0, 0.0]

def update_time():
    if data[0] == True:
        elapsed_time = data[2] + (time.time()-data[1])
        seconds = int(elapsed_time)
        h = seconds // 3600
        m = (seconds%3600) //60
        s = seconds % 60

        label.config(text=f"{h:02d}:{m:02d}:{s:02d}")
        root.after(100, update_time)

def start():
    if data[0] == False:
        data[0] = True
        data[1] = time.time()
        update_time()

def stop():
    if data[0] == True:
        data[2] = data[2] + time.time() - data[1]
        data[0] = False

def reset():
    data[0] = False
    data[1] = 0.0
    data[2] = 0.0
    label.config(text="00:00:00")


frame_for_buttons_to_be_horizontal = tk.Frame(root)
frame_for_buttons_to_be_horizontal.pack(pady=5)

start_button = tk.Button(frame_for_buttons_to_be_horizontal, text="START", width=7, command=start)
start_button.pack(side="left", padx=4)
stop_button = tk.Button(frame_for_buttons_to_be_horizontal, text="STOP", width=7, command=stop)
stop_button.pack(side="left", padx=4)
reset_button = tk.Button(frame_for_buttons_to_be_horizontal, text="RESET", width=7, command=reset)
reset_button.pack(side="left", padx=4)

root.mainloop()
