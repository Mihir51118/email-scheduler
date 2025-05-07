const form = document.getElementById('scheduleForm');
const emailInput = document.getElementById('emailInput');
const timeInput = document.getElementById('timeInput');
const listEl = document.getElementById('scheduleList');
const API = 'http://localhost:3000/schedules';

async function fetchSchedules() {
  const res = await fetch(API);
  return res.json();
}

async function addSchedule(email, time) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, time })
  });
  return res.json();
}

async function deleteSchedule(id) {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
}

function renderList(items) {
  listEl.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.email} @ ${item.time}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = async () => {
      await deleteSchedule(item.id);
      load();
    };
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

async function load() {
  const items = await fetchSchedules();
  renderList(items);
}

form.onsubmit = async e => {
  e.preventDefault();
  await addSchedule(emailInput.value, timeInput.value);
  emailInput.value = '';
  timeInput.value = '';
  load();
};

window.addEventListener('DOMContentLoaded', load);
