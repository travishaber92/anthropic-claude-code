const stretches = [
  {
    name: "Knee-to-Chest",
    category: "bed",
    duration: "30s each side",
    blurb: "Lie on your back. Gently draw one knee toward your chest, hold, then switch. Eases lumbar tightness.",
  },
  {
    name: "Pelvic Tilt",
    category: "bed",
    duration: "10 reps",
    blurb: "Flatten your lower back against the bed by tilting your pelvis up. Holds activate deep core muscles.",
  },
  {
    name: "Supine Figure-4",
    category: "bed",
    duration: "30s each side",
    blurb: "Cross one ankle over the opposite knee and pull the bottom leg toward you. Opens tight glutes.",
  },
  {
    name: "Seated Forward Fold",
    category: "chair",
    duration: "45s",
    blurb: "Sit tall, then hinge forward from the hips with a soft spine. Lengthens hamstrings and lower back.",
  },
  {
    name: "Seated Spinal Twist",
    category: "chair",
    duration: "30s each side",
    blurb: "Sit tall, twist gently and hold the chair back for support. Mobilizes the thoracic and lumbar spine.",
  },
  {
    name: "Figure-4 Seated",
    category: "chair",
    duration: "30s each side",
    blurb: "Ankle on opposite knee, lean forward from the hips until you feel a glute stretch.",
  },
  {
    name: "Child's Pose",
    category: "floor",
    duration: "60s",
    blurb: "Kneel, sit back on your heels, reach forward. A classic decompression for the lower back.",
  },
  {
    name: "Cat-Cow",
    category: "floor",
    duration: "10 slow reps",
    blurb: "On hands and knees, alternate arching and rounding your spine with the breath.",
  },
  {
    name: "Glute Bridge",
    category: "floor",
    duration: "10 reps, 3s hold",
    blurb: "Lie on your back, knees bent. Lift hips by squeezing glutes — strengthens posterior chain.",
  },
  {
    name: "Bird Dog",
    category: "floor",
    duration: "8 reps each side",
    blurb: "On hands and knees, extend opposite arm and leg. Builds stabilizing core and back.",
  },
  {
    name: "Sphinx Pose",
    category: "floor",
    duration: "45s",
    blurb: "Lie on your stomach on forearms. A gentle extension that counters too much sitting.",
  },
  {
    name: "Piriformis Stretch",
    category: "floor",
    duration: "30s each side",
    blurb: "Lying figure-4 with gentle pull. Calms sciatic-style tension in the glute.",
  },
];

const grid = document.getElementById("stretchGrid");
function renderStretches(filter = "all") {
  grid.innerHTML = "";
  const items = filter === "all" ? stretches : stretches.filter((s) => s.category === filter);
  for (const s of items) {
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="meta">${s.category}</div>
      <h3>${s.name}</h3>
      <p>${s.blurb}</p>
      <div class="duration">⏱ ${s.duration}</div>
    `;
    grid.appendChild(el);
  }
}
renderStretches();

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => {
      c.classList.remove("active");
      c.setAttribute("aria-selected", "false");
    });
    chip.classList.add("active");
    chip.setAttribute("aria-selected", "true");
    renderStretches(chip.dataset.filter);
  });
});

// Guided routine timer
const routine = [
  { name: "Settle in", hint: "Sit or lie down. Take three slow breaths.", seconds: 30 },
  { name: "Child's Pose", hint: "Kneel, sit back, reach forward. Breathe into your lower back.", seconds: 45 },
  { name: "Cat-Cow", hint: "On hands and knees, alternate arching and rounding with your breath.", seconds: 45 },
  { name: "Knee-to-Chest (right)", hint: "On your back. Hug your right knee gently toward your chest.", seconds: 30 },
  { name: "Knee-to-Chest (left)", hint: "Switch sides. Keep the other leg relaxed.", seconds: 30 },
  { name: "Glute Bridge", hint: "Lift the hips by squeezing the glutes. Lower slowly.", seconds: 45 },
  { name: "Supine Twist (right)", hint: "Drop your knees to the right. Look left. Soft shoulders.", seconds: 30 },
  { name: "Supine Twist (left)", hint: "Switch sides. Let gravity do the work.", seconds: 30 },
  { name: "Rest", hint: "Lie still. Notice how your back feels now.", seconds: 35 },
];

const clockEl = document.getElementById("clock");
const stepNameEl = document.getElementById("stepName");
const stepHintEl = document.getElementById("stepHint");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const listEl = document.getElementById("timerList");

let stepIndex = 0;
let remaining = routine[0].seconds;
let intervalId = null;

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

function renderList() {
  listEl.innerHTML = "";
  routine.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${s.name} · ${s.seconds}s`;
    if (i < stepIndex) li.classList.add("done");
    if (i === stepIndex) li.classList.add("active");
    listEl.appendChild(li);
  });
}

function renderStep() {
  const s = routine[stepIndex];
  stepNameEl.textContent = s.name;
  stepHintEl.textContent = s.hint;
  clockEl.textContent = fmt(remaining);
  renderList();
}

function tick() {
  remaining -= 1;
  if (remaining < 0) {
    stepIndex += 1;
    if (stepIndex >= routine.length) {
      stop();
      stepNameEl.textContent = "All done";
      stepHintEl.textContent = "Nice work. Notice any small changes in how your back feels.";
      clockEl.textContent = "00:00";
      renderList();
      return;
    }
    remaining = routine[stepIndex].seconds;
  }
  renderStep();
}

function start() {
  if (intervalId) return;
  intervalId = setInterval(tick, 1000);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function stop() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function reset() {
  stop();
  stepIndex = 0;
  remaining = routine[0].seconds;
  renderStep();
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);

renderStep();
