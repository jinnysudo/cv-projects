import cv2 # Imports the cv2 library.
face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml") # Imports the haarcascade classifier for detecting the face.
cap = cv2.VideoCapture(0) # Captures the feed from first camera.
    
while True: # Creates an infinte loop.
    ret, frame = cap.read() # Returns current frame from camera feed.
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) # Converts the bgr image to grayscale.
    faces = face_cascade.detectMultiScale(gray, 1.3, 1) # MOST_IMP_LINE. Helps us to actually detect the face. It is using the grey image, with a reduce scale factor of 30 percent and atleast 5 objects around to confirm whether the detected part is a face or not.
    if len(faces) > 0: # When there is a face detected from the previous line of code, the cod einside gets executed.
        x,y,w,h = faces[0] # Stores the coordinates of the region of face inside the variables x,y,w,h as that is the order in which the haarcascade model sends the attrs.
        cv2.rectangle(frame, (x,y), (x+w, y+h), (255,255,0), 2) # Draws a rectangle around the region of intrest.
        roi_gray = gray[y:y+h, x:x+w] # Stores the region of interest from the gray image inside the variable roi_gray.
        roi_color = frame[y:y+h, x:x+w] # Stores the region of interest from the bgr image inside the roi_color variable.
        
    cv2.imshow("Camera", frame) # Shows the camera feed by showing the frame from the camera to the user.
    if cv2.waitKey(1) == ord("q"): # Shuts the program window when q is pressed.
        break # Breaks to execute the code to shut down outside the loop.
    
cap.release() # Releases the camera so it can be sued in some other app.
cv2.destroyAllWindows() # Destroys all windows.
