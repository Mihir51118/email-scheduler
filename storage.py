import json
import os

# File to store the scheduled email data
DATA_FILE = "scheduled_emails.json"

# Check if the data file exists; if not, create it
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

def load_schedules():
    """Load scheduled emails from the data file."""
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_schedules(schedules):
    """Save the scheduled emails to the data file."""
    with open(DATA_FILE, "w") as f:
        json.dump(schedules, f)

def remove_scheduled_email(email_id):
    """Remove a scheduled email item from the data file."""
    schedules = load_schedules()
    schedules = [sched for sched in schedules if sched["id"] != email_id]
    save_schedules(schedules)
