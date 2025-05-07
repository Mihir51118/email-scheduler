import streamlit as st
import json
import os
from datetime import datetime
from scheduler import schedule_email, cancel_job
from storage import load_schedules, save_schedules

# Load existing schedules from file
schedules = load_schedules()

st.set_page_config(page_title="Email Scheduler", layout="centered")
st.title("📧 Daily Email Scheduler")

# Form to create a new scheduled email
with st.form("schedule_form"):
    email = st.text_input("Recipient Email")
    time = st.time_input("Schedule Time (24-hour format)")
    submitted = st.form_submit_button("Add Schedule")

    if submitted:
        if email and time:
            time_str = time.strftime("%H:%M")
            new_item = {
                "id": str(int(datetime.now().timestamp() * 1000)),  # Use timestamp for unique ID
                "email": email,
                "time": time_str
            }
            schedules.append(new_item)
            schedule_email(new_item)  # Schedule the email using the scheduler
            save_schedules(schedules)  # Save updated schedules to file
            st.success(f"Scheduled {email} at {time_str}")
        else:
            st.error("Please provide both email and time.")

# Display scheduled emails
st.subheader("📅 Scheduled Emails")
if schedules:
    for sched in schedules:
        col1, col2, col3 = st.columns([5, 3, 2])
        with col1:
            st.write(sched["email"])
        with col2:
            st.write(sched["time"])
        with col3:
            if st.button("Delete", key=sched["id"]):
                cancel_job(sched)  # Cancel the scheduled email
                schedules = [s for s in schedules if s["id"] != sched["id"]]  # Remove from the list
                save_schedules(schedules)  # Save the updated schedule
                st.experimental_rerun()  # Refresh the app to reflect changes
else:
    st.write("No emails scheduled yet.")
