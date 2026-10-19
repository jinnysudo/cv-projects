import os
import re
import csv
import imaplib
import email
import random
import tkinter as tk
from tkinter import messagebox, filedialog
from email.header import decode_header

DEFAULT_FOLDER = "C:/Users/ASUS/Downloads/cv/emails"

SPAM_WORDS = {'lottery', 'winner', 'free', 'claim', 'urgent', 'money', 'prize', 'congratulations', 'click here', 'act now', 'limited time', 'buy now', 'cash', 'win', 'subscribe'}
PROMO_WORDS = {'discount', 'offer', 'sale', 'deal', 'save', 'coupon', 'special', 'promo', 'exclusive', 'newsletter', 'shop', 'clearance', 'buy', 'order'}
IMPORTANT_WORDS = {'project', 'meeting', 'deadline', 'invoice', 'schedule', 'payment', 'client', 'report', 'proposal', 'action required', 'follow up', 'important', 'urgent', 'appointment'}

SPAM_THRESHOLD = 2
PROMO_THRESHOLD = 2
IMPORTANT_THRESHOLD = 2

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def find_matches(text: str, keywords: set) -> list:
    return [k for k in keywords if k in text]

def classify_email(text: str) -> dict:
    text_clean = clean_text(text)
    spam_matches = find_matches(text_clean, SPAM_WORDS)
    promo_matches = find_matches(text_clean, PROMO_WORDS)
    important_matches = find_matches(text_clean, IMPORTANT_WORDS)

    spam_score = float(len(spam_matches))
    promo_score = float(len(promo_matches))
    important_score = float(len(important_matches))

    if re.search(r'[A-Z]{2,}', text):
        spam_score += 0.5
    spam_score += text.count("!") * 0.2

    if 'invoice' in text_clean or 'payment' in text_clean or 'client' in text_clean:
        important_score += 1

    label = 'Important'
    if spam_score >= SPAM_THRESHOLD and spam_score >= promo_score and spam_score >= important_score:
        label = 'Spam'
    elif promo_score >= PROMO_THRESHOLD and promo_score > spam_score and promo_score >= important_score:
        label = 'Promotional'
    elif important_score >= IMPORTANT_THRESHOLD:
        label = 'Important'
    else:
        if len(text_clean) < 50 and ('http' in text_clean or 'www.' in text_clean):
            label = 'Promotional'
        else:
            label = 'Important'

    return {
        'label': label,
        'spam_matches': spam_matches,
        'promo_matches': promo_matches,
        'important_matches': important_matches,
        'scores': {
            'spam_score': round(spam_score, 2),
            'promo_score': round(promo_score, 2),
            'important_score': round(important_score, 2)
        }
    }

def get_gmail_credentials():
    login_win = tk.Toplevel()
    login_win.title("Enter Gmail Credentials")
    login_win.geometry("350x180")
    login_win.resizable(False, False)

    tk.Label(login_win, text="Gmail Address:", font=('Arial', 11)).pack(pady=(15, 5))
    email_entry = tk.Entry(login_win, width=40, font=('Arial', 11))
    email_entry.pack(pady=2)

    tk.Label(login_win, text="App Password:", font=('Arial', 11)).pack(pady=(10, 5))
    pass_entry = tk.Entry(login_win, width=40, font=('Arial', 11), show="*")
    pass_entry.pack(pady=2)

    result = {"email": None, "password": None}

    def submit():
        email_val = email_entry.get().strip()
        pass_val = pass_entry.get().strip()
        if not email_val or not pass_val:
            messagebox.showwarning("Missing Info", "Please fill in both fields.")
            return
        result['email'] = email_val
        result['password'] = pass_val
        login_win.destroy()

    tk.Button(login_win, text="Submit", command=submit, font=("Arial", 11, 'bold')).pack(pady=12)
    login_win.grab_set()
    login_win.wait_window()
    return result['email'], result['password']

def fetch_emails_from_gmail(save_folder: str, user: str, app_password: str, max_emails: int = 10):
    imap_server = 'imap.gmail.com'
    saved_files = []
    mail = None

    try:
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(user, app_password)
        mail.select("inbox")
        status, data = mail.search(None, "ALL")
        if status != "OK":
            return saved_files

        email_ids = data[0].split()

        for i, eid in enumerate(reversed(email_ids[-max_emails:]), 1):
            eid_str = eid.decode('utf-8') if isinstance(eid, bytes) else str(eid)
            res, msg_data = mail.fetch(eid_str, "(RFC822)")
            if res != "OK":
                continue

            msg = email.message_from_bytes(msg_data[0][1])
            from_ = msg.get("From", "Unknown sender")
            subject_header = msg.get("Subject", "No Subject")
            decoded_parts = decode_header(subject_header)
            subject = ""
            for sub, enc in decoded_parts:
                if isinstance(sub, bytes):
                    subject += sub.decode(enc or "utf-8", errors='ignore')
                else:
                    subject += str(sub)

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == 'text/plain' and 'attachment' not in content_disposition:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode("utf-8", errors="ignore")
                        break
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode("utf-8", errors="ignore")

            safe_subject = re.sub(r'[^A-Za-z0-9_]+', '_', subject)[:50]
            filename = f"email_{i}_{safe_subject}.txt"
            file_path = os.path.join(save_folder, filename)

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"From: {from_}\n\n{body.strip()}")

            saved_files.append(file_path)

    except imaplib.IMAP4.error as e:
        messagebox.showerror("IMAP Error", str(e))
    finally:
        try:
            if mail is not None:
                mail.close()
                mail.logout()
        except Exception:
            pass

    return saved_files

class emailClassApp:

    def __init__(self, root):
        self.root = root
        self.root.title('Email Classifier (Gmail + Local Files)')
        self.root.geometry('850x650')

        self.folder = DEFAULT_FOLDER
        self.file_list = []
        self.index = 0

        top_frame = tk.Frame(root)
        top_frame.pack(fill=tk.X, padx=10, pady=8)

        self.folder_label = tk.Label(top_frame, text=f"Folder: {self.folder}")
        self.folder_label.pack(side=tk.LEFT)

        tk.Button(top_frame, text="Load Folder", command=self.choose_folder).pack(side=tk.LEFT, padx=6)
        tk.Button(top_frame, text="Refresh", command=self.load_files).pack(side=tk.LEFT)
        tk.Button(top_frame, text="Fetch from Gmail", command=self.fetch_from_gmail).pack(side=tk.LEFT, padx=6)
        tk.Button(top_frame, text="Save results to CSV", command=self.save_results).pack(side=tk.RIGHT)

        mid_frame = tk.Frame(root)
        mid_frame.pack(fill=tk.BOTH, expand=True, padx=10)
        self.title_label = tk.Label(mid_frame, text="No file loaded", font=('Arial', 14, 'bold'))
        self.title_label.pack(anchor='w')
        self.text_area = tk.Text(mid_frame, wrap=tk.WORD, height=18, font=("Arial", 12))
        self.text_area.pack(fill=tk.BOTH, expand=True, pady=6)
        self.text_area.config(state=tk.DISABLED)

        self.bottom_frame = tk.Frame(root)
        self.bottom_frame.pack(fill=tk.X, padx=10, pady=8)
        self.result_label = tk.Label(self.bottom_frame, text='Result: N/A', font=('Arial', 12))
        self.result_label.pack(anchor='w')
        self.matches_label = tk.Label(self.bottom_frame, text='Matches: N/A')
        self.matches_label.pack(anchor='w')

        nav_frame = tk.Frame(self.bottom_frame)
        nav_frame.pack(fill=tk.X, pady=6)
        tk.Button(nav_frame, text="Previous", command=self.pre_file).pack(side=tk.LEFT)
        tk.Button(nav_frame, text="Classify", command=self.classify_current).pack(side=tk.LEFT, padx=8)
        tk.Button(nav_frame, text="Next", command=self.next_file).pack(side=tk.LEFT)
        tk.Button(nav_frame, text="Shuffle", command=self.shuffle_files).pack(side=tk.RIGHT)

        self.status_label = tk.Label(root, text="Status: Ready", anchor='w')
        self.status_label.pack(fill=tk.X, padx=10, pady=(0, 8))

        self.load_files()

    def choose_folder(self):
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.folder = folder_selected
            self.folder_label.config(text=f"Folder: {self.folder}")
            self.load_files()

    def load_files(self):
        self.file_list = []
        if not os.path.isdir(self.folder):
            self.status_label.config(text=f'Status: Folder not found: {self.folder}')
            return
        for f in sorted(os.listdir(self.folder)):
            if f.lower().endswith('.txt'):
                full = os.path.join(self.folder, f)
                try:
                    with open(full, 'r', encoding='utf-8') as fh:
                        if fh.read().strip():
                            self.file_list.append(f)
                except Exception as e:
                    print(f'Error reading: {full}, {e}')
        if not self.file_list:
            self.status_label.config(text='Status: No .txt files found')
            self.title_label.config(text='No file loaded')
            self.text_area.config(state=tk.NORMAL)
            self.text_area.delete('1.0', tk.END)
            self.text_area.config(state=tk.DISABLED)
            return
        self.index = 0
        self.status_label.config(text=f'Status: Loaded {len(self.file_list)} files')
        self.show_files()

    def fetch_from_gmail(self):
        email_user, email_pass = get_gmail_credentials()
        if not email_user or not email_pass:
            messagebox.showinfo("Cancelled", "Gmail fetch cancelled.")
            return
        messagebox.showinfo("Fetching", "Connecting to Gmail. Please wait....")
        saved = fetch_emails_from_gmail(
            save_folder=self.folder,
            user=email_user,
            app_password=email_pass,
            max_emails=10
        )
        messagebox.showinfo("Done", f"Fetched and saved {len(saved)} emails.")
        self.load_files()

    def show_files(self):
        if not self.file_list:
            return
        fname = self.file_list[self.index]
        full = os.path.join(self.folder, fname)
        with open(full, 'r', encoding='utf-8') as fh:
            content = fh.read()
        self.title_label.config(text=f"[{self.index+1}/{len(self.file_list)}] {fname}")
        self.text_area.config(state=tk.NORMAL)
        self.text_area.delete('1.0', tk.END)
        self.text_area.insert(tk.END, content)
        self.text_area.config(state=tk.DISABLED)
        self.result_label.config(text="Result: N/A")
        self.matches_label.config(text='Matches: N/A')
        self.status_label.config(text=f'Status: Ready - Viewing {fname}')

    def next_file(self):
        if self.index < len(self.file_list) - 1:
            self.index += 1
            self.show_files()
        else:
            messagebox.showinfo('End', "No more files.")

    def pre_file(self):
        if self.index > 0:
            self.index -= 1
            self.show_files()
        else:
            messagebox.showinfo('Start', 'This is the first file.')

    def shuffle_files(self):
        if not self.file_list:
            return
        random.shuffle(self.file_list)
        self.index = 0
        self.show_files()

    def classify_current(self):
        if not self.file_list:
            messagebox.showwarning('No files detected', 'No emails loaded to classify.')
            return
        fname = self.file_list[self.index]
        full = os.path.join(self.folder, fname)
        with open(full, 'r', encoding='utf-8') as fh:
            content = fh.read()
        res = classify_email(content)
        label = res['label']
        spam_m = res['spam_matches']
        promo_m = res['promo_matches']
        important_m = res['important_matches']
        scores = res['scores']
        self.result_label.config(text=f"Result: {label} (spam:{scores['spam_score']}, promo:{scores['promo_score']}, important:{scores['important_score']})")
        matches_text = f"spam: {', '.join(spam_m) if spam_m else '-'} | promo: {', '.join(promo_m) if promo_m else '-'} | important: {', '.join(important_m) if important_m else '-'}"
        self.matches_label.config(text=f'Matches: {matches_text}')
        self.status_label.config(text=f"Status: Classified {fname} as {label}")

    def save_results(self):
        if not self.file_list:
            messagebox.showwarning('No Files', 'No email files found to export.')
            return
        save_path = filedialog.asksaveasfilename(defaultextension='.csv', filetypes=[("CSV files", '*.csv')], title='Save Classification Results')
        if not save_path:
            return
        fieldnames = ['filename', 'label', 'spam_matches', 'promo_matches', 'important_matches', 'spam_score', 'promo_score', 'important_score']

        try:
            records = []
            for fname in self.file_list:
                full = os.path.join(self.folder, fname)
                with open(full, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                res = classify_email(content)
                records.append({
                    'filename': fname,
                    'label': res['label'],
                    'spam_matches': ';'.join(res['spam_matches']),
                    'promo_matches': ';'.join(res['promo_matches']),
                    'important_matches': ';'.join(res['important_matches']),
                    'spam_score': res['scores']['spam_score'],
                    'promo_score': res['scores']['promo_score'],
                    'important_score': res['scores']['important_score']
                })
            with open(save_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(records)

            messagebox.showinfo('Saved', f'{len(records)} email results saved successfully.\n\nFile:\n{save_path}')
            self.status_label.config(text=f'Status: Saved {len(records)} results to CSV')

        except Exception as e:
            messagebox.showerror('Error', f'Failed to save CSV:\n\n{e}')

if __name__ == "__main__":
    root = tk.Tk()
    app = emailClassApp(root)
    root.mainloop()
