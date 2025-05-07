import schedule
import time
import threading
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))

jobs = {}

def send_email(to_email):
    msg = MIMEText("This is your automated daily email.")
    msg["Subject"] = "Daily Scheduled Email"
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Error sending to {to_email}: {e}")

def schedule_email(item):
    def job():
        send_email(item["email"])

    schedule_time = item["time"]
    job_obj = schedule.every().day.at(schedule_time).do(job)
    jobs[item["id"]] = job_obj
    print(f"⏰ Scheduled {item['email']} at {schedule_time}")

def cancel_job(item):
    job = jobs.get(item["id"])
    if job:
        schedule.cancel_job(job)
        print(f"❌ Cancelled job for {item['email']}")
        jobs.pop(item["id"], None)

# Run schedule in background
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

threading.Thread(target=run_scheduler, daemon=True).start()
