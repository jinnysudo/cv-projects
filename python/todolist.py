import tkinter as tk # Imports the tkinter library.
root = tk.Tk() # Initializes the root window.
root.title("To-Do List App") # Creates the title of the root window. 
root.geometry("400x400") # Sets the size of the root window.

def add(): # Defines the add function.
    global add # Globalizes the add variable
    add=entry_add.get() # Gets the text from the add entry and stores it in the add variable.
    list_box.insert(tk.END, add) # Adds the text to the last index.

def delete(): # Defines the delete function.
    global ind # Gloablizes the ind variable.
    ind = list_box.curselection() # Gets the index of the user selected entry from the listbox.
    list_box.delete(ind, ind) # Deletes the index gotten by the previous curselection command.

def clear(): # Defines the clear function.
    list_box.delete(0, tk.END) # Deletes all the entries of the listbox.

heading_label = tk.Label(root, text="TO-DO LIST APP", font=("Arial", 18)) # This group of code creates the heading of the app.
heading_label.pack(pady=15)

add_label = tk.Label(root, text="Add a to-do 😊.", font=("Gothic", 12)) # This group of code creates the entry add label of the app.
add_label.pack()

entry_add = tk.Entry(root, width="45") # This group of code creates the add entry of the app.
entry_add.pack(pady=5)

add_button = tk.Button(text="Add", bg="yellow", command=add) # This group of code creates the add button of the app.
add_button.pack(pady=5)

list_box = tk.Listbox(root, width=45, height=10) # This group of code creates the listbox of the app.
list_box.pack(pady=7)

delete_button = tk.Button(text="Delete", bg="red", command=delete) # This group of code creates the delete button of the app.
delete_button.place(anchor="sw", x=50, y= 375)

delete_button = tk.Button(text="Clear All", bg="red", command=clear) # This group of code creates the clear all button of the app.
delete_button.place(anchor="se", x=350, y=375)
root.mainloop() # Loops the root window.
