import tkinter as tk # Imports the tkinter GUI library.
from textblob import TextBlob # Imports the TextBlob text processing library.

def analyze_sentiment(): # Creates a function to analyse the user's sentiment while writing the review.
    review = input_text.get("1.0", tk.END).strip() # Strips the text from the TextBox created below.
    if review: # If the review contains text, then the code below will be executed.
        blob = TextBlob(review) # Converts the review text into a blob for TextBlob to process.
        polarity = blob.sentiment.polarity # Measures the polarity of the user's sentiment while writing the review.
        if polarity > 0.2: # Checks if the polarity is more than 0.2.
            result = "😊 Positive" # If yes, then stores the result as positive.
        elif polarity < -0.1: # If the polarity is smaller than -1.
            result = "😠 Negative" # If yes, then stores the result as negative.
        else: # If none of the above conditions are true.
            result = "😑 Neutral" # If yes, then stores the result as neutral.

        output_label.config(text=f"Sentiment: {result}", font =("Arial", 14, "bold")) # Displays the result text onto the output label created below.
    else:
        output_label.config(text="Please enter a review.", font=("Arial", 12)) # If no text was inputted in the review box, then displays the "Please enter a review." text onto the output label.


root = tk.Tk() # Initializes tkinter into the root variable to create a gui screen.
root.title("Consumer Sentiment Analyzer") # Sets the title of the root window as "Consumer Sentiment Analyzer".
root.geometry("400x300") # Gives size to the root window.
root.configure(bg="#f0f0f0") # Gives background color to the root window.

title = tk.Label(root, text="Enter Customer Review:", font=("Arial",14), bg="#f0f0f0") # Creates a label to display the title of the app.
title.pack(pady=10) # Packs the label onto the screen.

input_text = tk.Text(root, height = 5, width=40, font=("Arial", 12)) # Creates a text box for the user to enter text for review of the user's sentiment.
input_text.pack(pady=5) # Packs the textbox onto the screen.

analyze_btn = tk.Button(root, text="Analyze Sentiment", command=analyze_sentiment, bg="#4CAF50", fg="white") # Creates a button which starts the sentiment analyzing function.
analyze_btn.pack(pady=10) # Packs the analyze button onto the root window.

output_label = tk.Label(root, text="", font=("Arial", 14), bg="#f0f0f0") # Creates a output label to display the output sentiment.
output_label.pack(pady=10) # Packs the output label onto the root window.

root.mainloop() # Makes the root window stay and not crash in milliseconds. Basically loops the root window.
