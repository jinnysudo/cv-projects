import cv2 # Imports the opencv library.
import mediapipe as mp # Imports the mediapipe library.

mp_hands = mp.solutions.hands # Accesses the medipipe hands module which helps to detect hands and tracking its landmark.
mp_drawing = mp.solutions.drawing_utils # Accesses the drawing module of mediapipe which helps in rendering the landmark points at the location of the hand.

cap = cv2.VideoCapture(0) # Starts capturing the feed from the first camera.
with mp_hands.Hands(max_num_hands=2, min_detection_confidence = 0) as hands: # Detects the hand. It's parameters enable it to detect only 2 hands at a time and even if the confidence of the model that what it has detected is a hand, is low, then also it will detect as the threshold has been set as 0.

    while True: # Initiates a forever loop.
        ret,frame = cap.read() # Reads and returns the camera frame from the camera feed stored in the variable 'cap' above.
        if not ret: # If the frame isnt returned, it breaks from the loop and destroys all windows.
            break # Breaks the loop.
        h,w,c = frame.shape # Stores the frames height, width and color into separate variables.
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # Coverts BGR to RGB.
        results = hands.process(rgb) # Detects the gestures and stores the results in the results variable.
        gesture = "" # Sets the gesture string as a null string.
        if results.multi_hand_landmarks: # Checks whether any hands were detected in the current frame.
            for hand_landmarks in results.multi_hand_landmarks: # If yes, then iterate over each of the 21 landmarks that mediapipe gives and execute the code below.
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS) # Draws the points where needed to show the hand skeleton and gestures.
                landmarks = hand_landmarks.landmark # Stores the hand landmarks in the landmarks variable to be used later.
                fingers_up = [] # Creates an empty list to check for gestures later in the code.
                tip_ids = [4,8,12,16,20] # Creates a list with the id's of landmarks of tips of all fingers except thumb as thumb will be checked later in the code as the x coordinate has to be checked.
                for i in range(1,5): # Initiates a for loop to check if the 4 main fingers except the thumb are open or closed.
                    if landmarks[tip_ids[i]].y < landmarks[tip_ids[i]-2].y: # Checks whether the finger is open or not by checking whether the tip of the finger is above the bottom.
                        fingers_up.append(1) # Appends 1 to the list for each open finger.
                    else:
                        fingers_up.append(0) # Appends 0 to the list if the finger is closed.
                if landmarks[tip_ids[0]].x > landmarks[tip_ids[0]-1].x: # This is specially for the thumb. As the thumb opens almost horizontally, we check the x coordinate of the tip and bottom of thumb instead of y coordinate. 
                    fingers_up.insert(0,1) # Appends 1 to the start of the list is the thumb is open.
                else:
                    fingers_up.insert(0,0) # Appends 0 to the list's start if the thumb is closed.
                if fingers_up == [0,1,1,0,0]: # Checks for the victory gesture.
                    gesture="Victory" # Displays 'Victory'.
                if fingers_up == [1,1,1,1,1]: # Checks for open palm gesture.
                    gesture="Open Palm" # Displays 'Open Palm'.
                if fingers_up == [0,0,0,0,0]: # Checks for the fist gesture.
                    gesture="Fist" # Displays 'Fist'
        cv2.putText(frame, f"Gesture: {gesture}", (10,40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2) # Puts the text stored in the gesture string onto the frame.
        cv2.imshow("Hand Gesture Recognition", frame) # Shows the current camera frame image to the user along with landmarks and a title.
        if cv2.waitKey(1) == ord("q"): # When the letter q is pressed,.....
            break # Breaks the program.
    
    
cap.release() # Releases the camera so it can be used elsewhere.
cv2.destroyAllWindows() # Destroys all windows shown to the user.
