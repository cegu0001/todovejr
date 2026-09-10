import { loadJSON } from "./utils_lib.js";
import {
  geocodeLocation,
  fetchWeatherForDate,
  getWeatherIcon,
  getWeatherDescription,
  isRainCode,
} from "./weather.js";

let tasks = [];

// henter elementer
const taskInput = document.getElementById("taskInput");
const amountInput = document.getElementById("amountInput");
const dateInput = document.getElementById("dateInput");
const outdoorInput = document.getElementById("outdoorInput");
const locationInput = document.getElementById("locationInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const doneList = document.getElementById("doneList");
const feedback = document.getElementById("feedback");

// sæt dagens dato som standardværdi i date-picker'en
dateInput.value = new Date().toISOString().split("T")[0];

// opretter opgave
addBtn.addEventListener("click", async function () {
  if (taskInput.value === "") {
    showFeedback("Tilføj en opgave");
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    text: taskInput.value,
    amount: amountInput.value ? amountInput.value : null, // valgfrit felt
    date: dateInput.value || null,
    outdoor: outdoorInput.checked,
    location: outdoorInput.checked ? locationInput.value || "København" : null,
    done: false,
    weather: null, // { code, tempMax, tempMin } - udfyldes evt. herunder
    weatherStatus: "none", // "none" | "loading" | "loaded" | "error"
  };

  tasks.push(newTask);
  saveToLocalStorage();
  render();

  taskInput.value = "";
  amountInput.value = "";

  showFeedback("Opgave tilføjet!");

  // Hvis opgaven er markeret udendørs og har en dato, hent vejret for den dag
  if (newTask.outdoor && newTask.date) {
    await updateWeatherForTask(newTask.id);
  }
});

// henter vejr for en enkelt opgave og opdaterer den i tasks-arrayet
async function updateWeatherForTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.outdoor || !task.date) return;

  task.weatherStatus = "loading";
  render();

  try {
    const place = await geocodeLocation(task.location || "København");
    const weather = await fetchWeatherForDate(task.date, place.latitude, place.longitude);

    task.weather = weather;
    task.weatherStatus = "loaded";
    task.location = place.name; // brug det officielle bynavn fra API'et

    if (isRainCode(weather.code) && task.outdoor) {
      showFeedback(`Vejret ser vådt ud i ${place.name} - opgaven kan ikke laves udenfor`);
    } else {
      showFeedback("Vejrdata hentet");
    }
  } catch (error) {
    console.error(error);
    task.weatherStatus = "error";
    task.weather = null;
    showFeedback("Kunne ikke hente vejrdata - prøv evt. igen senere");
  }

  saveToLocalStorage();
  render();
}

// viser opgaverne
function render() {
  todoList.innerHTML = "";
  doneList.innerHTML = "";

  tasks.forEach(function (task) {
    const li = document.createElement("li");
    const isBlockedByRain =
      task.outdoor && task.weatherStatus === "loaded" && isRainCode(task.weather.code);

    li.innerHTML = `
    <div class="task-content">
        <div>
            <strong class="task-title">${task.text}</strong><br>
            ${task.amount ? `Antal: ${task.amount}<br>` : ""}
            ${task.date ? `Dato: ${task.date}` : ""}
            ${task.outdoor ? `<br><span class="outdoor-tag">🌳 Udendørs${task.location ? " · " + task.location : ""}</span>` : ""}
            ${renderWeather(task)}
            ${isBlockedByRain ? `<div class="unavailable-badge">⚠️ Utilgængelig - det regner</div>` : ""}
        </div>
        <div class="task-buttons">
            ${task.outdoor && task.date ? `<button onclick="window.updateWeather('${task.id}')">Opdater vejr</button>` : ""}
            <button onclick="toggleDone('${task.id}')">
                ${task.done ? "Fortryd" : "Færdig"}
            </button>
            <button onclick="deleteTask('${task.id}')">
                Slet
            </button>
        </div>
    </div>
`;

    if (isBlockedByRain) {
      li.classList.add("blocked");
    }

    if (task.done) {
      li.classList.add("done");
      doneList.appendChild(li);
    } else {
      todoList.appendChild(li);
    }
  });
}

// bygger HTML-snippet for vejr-delen af en opgave, afhængig af status
function renderWeather(task) {
  if (!task.outdoor) return "";

  if (task.weatherStatus === "loading") {
    return `<div class="weather-box">⏳ Henter vejr...</div>`;
  }

  if (task.weatherStatus === "error") {
    return `<div class="weather-box weather-error">⚠️ Vejrdata ikke tilgængelig for denne dato/lokation</div>`;
  }

  if (task.weatherStatus === "loaded" && task.weather) {
    const icon = getWeatherIcon(task.weather.code);
    const description = getWeatherDescription(task.weather.code);
    return `
      <div class="weather-box">
        <img src="${icon}" alt="${description}" class="weather-icon" />
        <span>${description}, ${Math.round(task.weather.tempMin)}° til ${Math.round(task.weather.tempMax)}°</span>
      </div>
    `;
  }

  return "";
}

// markérer som færdig
function toggleDone(id) {
  tasks = tasks.map(function (task) {
    if (task.id === id) {
      task.done = !task.done;
    }
    return task;
  });

  saveToLocalStorage();
  render();

  showFeedback("Status opdateret");
}

// sletter opgave
function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });

  saveToLocalStorage();
  render();

  showFeedback("Opgave slettet");
}

// feedback
function showFeedback(message) {
  feedback.textContent = message;

  setTimeout(function () {
    feedback.textContent = "";
  }, 3000);
}

function saveToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("tasks");
  if (data) {
    tasks = JSON.parse(data);
  }
}

// gør funktionerne tilgængelige for onclick-attributterne i den dynamisk indsatte HTML
window.toggleDone = toggleDone;
window.deleteTask = deleteTask;
window.updateWeather = updateWeatherForTask;

loadFromLocalStorage();
render();
