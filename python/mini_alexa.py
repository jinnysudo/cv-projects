import pyttsx3 # Imports the pyttsx3 library for text to speech.
import speech_recognition as sr # Imports the speech recognition library for speech recognition.
import datetime # Imports the datetime library for setting intervals and displaying time when necessary.
import json # Imports the json library for editing json files.
import webbrowser # Imports the webbrowser library for opening a browser inside the program.
import wikipedia # Imports the wikipedia library for searching through wikipedia.

engine = pyttsx3.init() # Initializes the pyttsxx3 library.
engine.setProperty('rate', 150) # Sets the rate property of the speech to be 150.
engine.setProperty('volume', 1.0) # Sets the volume of the speech to be 1.0.

try: # Creates a try - except function.
    with open("C:/Users/ASUS/Downloads/cv/responses.json", "r") as f: # Opens the json file using path.
        command_map = json.load(f) # Loads the json into the command_map variable.
except (json.JSONDecodeError, FileNotFoundError): # If either one of these errors occur, we are setting the command map as an empty dictionary.
    command_map = {} # Sets the command map as an empty dictionary as discussed above.

def speak(text): # Defines the speak function.
    print(f"Alexa: {text}") # Prints the text to be spoken.
    engine.say(text) # Makes the program speak the text.
    engine.runAndWait() # Runs the speaking part of the text and then waits after the text queue is over.

def listen(): # Defines the listen function.
    r = sr.Recognizer() # Initializes the speech recognizer module.
    with sr.Microphone() as source: # Sets the microphone of the user as the source of audio.
        print("Listening...") # Prints listening once the program starts listening.
        audio = r.listen(source) # Listens to the audio.
        try:
            command = r.recognize_google(audio) # Tries to recognize the audio and convert it to text.
            print("You said:", command) # If recognized, it will print the text spoken by the user.
            return command.lower() # Returns the lowercase version of the command.
        except sr.UnknownValueError: # If the listening fails due to an unknown value, it will return an empty string.
            return ''
        except sr.RequestError: # If the command fails due to a request error, it will print the following lines:- 
            speak("Sorry, there is a network error.") # Prints the text if the error is a request error caused by network.
            return '' # Returns an empty string.

def respond(command): # Defines the respond function.
    if not command: # If there was nothing in the command list, do the follwing:- 
        return # Returns nothing and loops back.

    if command in command_map: # If command exists in the json map.
        speak(command_map[command]) # Then, speaks the command.
    elif 'your name' in command: # If the text 'your name' exists in command, speaks the appropriate response.
        speak("I am mini alexa, your voice assistant.")
    elif "who created you" in command: # If the text 'who created you' exists in command, speaks the appropriate response.
        speak("Dhyanam created me.")
    elif 'time' in command: # If the text 'your time' exists in command, gets the time and speaks the appropriate response.
        time = datetime.datetime.now().strftime('%I:%M %p')
        speak(f"The time is {time}")
    elif 'google' in command:  # If the text 'google' exists in command, opens google in a webbrowser.
        speak("Opening google.")
        webbrowser.open_new_tab('https://www.google.com')
    elif "who is" in command or "tell me about" in command or "what is" in command:  # If the text 'tell me about' or 'what is' or 'who is' exists in command, searches through wikipedia and speaks the appropriate response.
        query = command.replace("who is", "").replace("tell me about", "").replace("what is", "").strip() # This process is done by:- First, replace the question words and strip them.
        try: # Then try to search
            results = wikipedia.search(query) # Searches for the results.
            if results: # If there is something in results....
                info = wikipedia.summary(results[0], sentences=2, auto_suggest=False) # The information is stored in the info variable.
                speak(info) # Then, the info is spoken.
            else: # However, if nothing exists in results....
                speak(f"I could not find anything about {query}.") # Speaks the appropriate response.
        except wikipedia.exceptions.DisambiguationError as e: # If the wikipedia text is ambiguous and cant be differentiated, select the response from the info and display it.
            info = wikipedia.summary(e.options[0], sentences=2, auto_suggest=False) # Does what is explained in the above line.
            speak(info) # Speaks the wikipedia information.
        except Exception as e: # If wikipedia couldnt find anything on that topic....
            print("Wikipedia error:", e) # Prints wikipedia error.
            speak("I could not find information on that topic.") # Says the appropriate response.
    elif "bye" in command: # If the text 'bye' exists in command, speaks the appropriate response.
        speak("Goodbye, have a great day.")
        exit() # Exits as the user has said goodbye.
    elif 'stop' in command: # If the text 'stop' exists in command, speaks the appropriate response.
        speak("Stopping") 
        exit() # Exits as the user has said goodbye.
    else:
        speak("Sorry, I don't understand.") # If none of the above things are true, then the bot cannot answer and says the appropriate response.

if __name__ == "__main__":                    # ALTERNATE FOR ROOT.MAINLOOP()
    speak("Hi, I am Alexa, how can I help you?") # Says the introduction at the beginning.
    while True: # Starts the forever loop.
        cmd = listen() # Listens for the command.
        respond(cmd) # Then responds.
