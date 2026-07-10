import os
import json
import base64
import requests
import smtplib
from email.message import EmailMessage

# --- Configuration ---
API_KEY = os.environ.get("GEMINI_API_KEY")
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={API_KEY}"

# Email settings (Configure these if you choose the email option)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SENDER_EMAIL = "your_email@gmail.com"
SENDER_APP_PASSWORD = "your_app_password" # Use an App Password, not your standard login

def generate_image(prompt_text):
    """Sends the markdown structure to the Gemini API and returns the image bytes."""
    headers = {'Content-Type': 'application/json'}
    payload = {
        "instances": [
            {"prompt": prompt_text}
        ],
        "parameters": {
            "sampleCount": 1,
            "outputOptions": {"mimeType": "image/png"}
        }
    }

    print("\nSending request to Gemini API...")
    response = requests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    # Extract the base64 encoded image from the response
    data = response.json()
    try:
        b64_image = data['predictions'][0]['bytesBase64Encoded']
        return base64.b64decode(b64_image)
    except KeyError:
        print("Error: Unexpected API response format.")
        print(data)
        return None

def save_to_disk(image_bytes, filename="generated_image.png"):
    """Saves the image bytes to a local file."""
    with open(filename, "wb") as f:
        f.write(image_bytes)
    print(f"\nSuccess! Image saved locally as {filename}")

def send_via_email(image_bytes, recipient_email, filename="generated_image.png"):
    """Emails the image as an attachment."""
    print(f"\nPreparing to send email to {recipient_email}...")
    
    msg = EmailMessage()
    msg['Subject'] = "Your Generated Image"
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg.set_content("Here is the image generated from your Markdown input.")
    
    msg.add_attachment(image_bytes, maintype='image', subtype='png', filename=filename)

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.send_message(msg)
        print(f"Success! Image emailed to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def main():
    if not API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return

    print("--- Gemini Image Generator ---")
    print("Paste your Markdown structure/prompt below. Press Enter, then CTRL+D (or CTRL+Z on Windows) to submit:\n")
    
    # Read multi-line markdown input from the user
    import sys
    markdown_input = sys.stdin.read().strip()
    
    if not markdown_input:
        print("No input provided. Exiting.")
        return

    image_bytes = generate_image(markdown_input)
    
    if not image_bytes:
        return

    # Post-generation routing
    choice = input("\nImage generated successfully! Do you want to [D]ownload or [E]mail the file? (D/E): ").strip().lower()
    
    if choice == 'd':
        save_to_disk(image_bytes)
    elif choice == 'e':
        recipient = input("Enter the recipient email address: ").strip()
        send_via_email(image_bytes, recipient)
    else:
        print("Invalid choice. Saving to disk by default.")
        save_to_disk(image_bytes)

if __name__ == "__main__":
    main()
