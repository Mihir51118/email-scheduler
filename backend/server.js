const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data.json');
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// — API middleware —
app.use(express.json());
app.use(cors());

// — Configure Nodemailer transporter —
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Optional: verify SMTP connection on startup
transporter.verify((err) => {
  if (err) console.error('SMTP connection error:', err);
  else console.log('✅ SMTP connection successful');
});

// — Helper: persist only plain data (no circular tasks) —
function saveSchedules(data) {
  fs.writeFileSync(
    DATA_PATH,
    JSON.stringify(data.map(({ id, email, time }) => ({ id, email, time })), null, 2),
    'utf8'
  );
}

// — Helper: schedule a cron job on a plain {id,email,time} object —
function scheduleJob(item) {
  const [hour, minute] = item.time.split(':');
  const cronExp = `${minute} ${hour} * * *`;  // daily at HH:MM
  console.log(`⏰ Scheduling ${item.email} at ${item.time} → cron "${cronExp}"`);
  item.task = cron.schedule(cronExp, () => {
    console.log(`✉️  Firing job for ${item.email} at ${new Date().toLocaleTimeString()}`);
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: item.email,
      subject: 'Daily Scheduled Email',
      text: 'This is your automated daily email.'
    }, (err, info) => {
      if (err) console.error('❌ Error sending to', item.email, err);
      else console.log('✅ Email sent to', item.email, info.response);
    });
  }, { timezone: 'Asia/Kolkata' });
}

// — Load existing schedules & schedule them in memory —
const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const schedules = raw.map(item => {
  const obj = { ...item };
  scheduleJob(obj);
  return obj;
});

// — API routes —

// GET /schedules → return plain array
app.get('/schedules', (req, res) => {
  res.json(schedules.map(({ id, email, time }) => ({ id, email, time })));
});

// POST /schedules → add, schedule, persist
app.post('/schedules', (req, res) => {
  const { email, time } = req.body;
  if (!email || !time) {
    return res.status(400).json({ error: 'Both email and time are required' });
  }
  const id = Date.now().toString();
  const newItem = { id, email, time };
  schedules.push(newItem);
  scheduleJob(newItem);
  saveSchedules(schedules);
  res.status(201).json({ id, email, time });
});

// DELETE /schedules/:id → remove, destroy task, persist
app.delete('/schedules/:id', (req, res) => {
  const { id } = req.params;
  const idx = schedules.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  schedules[idx].task.destroy();
  schedules.splice(idx, 1);
  saveSchedules(schedules);
  res.status(204).end();
});

// — Serve frontend static files —
app.use(express.static(FRONTEND_PATH));

// — Fallback for client-side routing —
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    return res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
  }
  next();
});

// — Start the server —
app.listen(port, () => {
  console.log(`Email scheduler backend running on http://localhost:${port}`);
});
