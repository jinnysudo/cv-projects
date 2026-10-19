import cv2 # Imports the cv2 (opencv) library. It provides functions for image processing, video processing, object detection etc.
cap = cv2.VideoCapture(0) # Initializes the video capture function of cv2 library. It creates a video capture object, saves it in the variable cap. O means the default webcam. If multiple cameras are connected, 0 means first camera, 1 means second camera and so on.
if not cap.isOpened(): # Checks whether the camera is accessible or not. It returns either true or false. Suppose the webcam is disconnected or used by some other application like zoom or skype, it will not be accessed.
    print("Cannot open camera") # Prints this message if the camera isnt accessible.
    exit() # Will exit the program after displaying the error message.

while True: # Creates a forever loop.
    ret, frame = cap.read() # It captures one image (frame) from the webcam. It returns two values. Ret will save a boolean value True when frame is captured successfully, and flase when frame isnt captured successfully. Frame will save the actual image which has been captured. It is stored as a numpy array. 
    if not ret: # Checks whether the frame has been captured successfully or not.
        print("Cannot recieve frame.") # Prints the error message when ret is false.
        break # Breaks out of the while loop when ret is false after printing the error message.
    cv2.imshow("Camera", frame) # Shows the frame returned by the read() function. Camera is the title of the window that displays the video.
    if cv2.waitKey(1) == ord("q"): # waitKey is a function of opencv that waits for the press of a keyboard key. Waits for a millisecond (1) and then refreshes the window. ord converts a character into its ASCII value. When we press 'q', waitKey(1) returns 113 which is the ASCII value of q and then compares it to the ord of q which is 113.
        break # Break's the loop when the condition is true.

cap.release() # It disconnects the webcam.
cv2.destroyAllWindows() # Destroys all the webcam/opencv windows that were open.
