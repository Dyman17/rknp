// --- ПАРАМЕТРЫ ПОРОГОВ (можешь подправить под ТБ компании) ---
const H2S_THRESHOLDS = [
  { max: 5, label: "Норма", cls: "safe" },
  { max: 10, label: "Повышено", cls: "caution" },
  { max: 20, label: "Опасно", cls: "warning" },
  { max: 50, label: "Очень опасно", cls: "danger" },
  { max: Infinity, label: "Критично", cls: "critical" },
];

const HOURS_THRESHOLDS = [
  { max: 8, label: "Норма", cls: "safe" },
  { max: 10, label: "Повышено", cls: "warn" },
  { max: Infinity, label: "Опасно", cls: "bad" },
];

// --- ДЕМО-ДАННЫЕ ГРУПП ---
const GROUPS = {
  uos5: [
    { name: "Айбек", h2s: 4, hours: 7.5, lat: 43.345, lng: 52.865 },
    { name: "Руслан", h2s: 12, hours: 9.2, lat: 43.362, lng: 52.881 },
    { name: "Марат", h2s: 58, hours: 10.8, lat: 43.392, lng: 52.901 },
    { name: "Данияр", h2s: 22, hours: 6.1, lat: 43.338, lng: 52.889 },
  ],
  uos7: [
    { name: "Алина", h2s: 8, hours: 5.4, lat: 43.351, lng: 52.872 },
    { name: "Нуржан", h2s: 17, hours: 11.2, lat: 43.371, lng: 52.896 },
    { name: "Ержан", h2s: 41, hours: 7.9, lat: 43.381, lng: 52.857 },
  ],
  uos9: [
    { name: "Саян", h2s: 2, hours: 4.2, lat: 43.333, lng: 52.843 },
    { name: "Айша", h2s: 9, hours: 8.0, lat: 43.346, lng: 52.821 },
    { name: "Арман", h2s: 27, hours: 10.1, lat: 43.368, lng: 52.812 },
  ],
};

let currentGroup = "uos5";
let map, markersLayer;

// --- Утилиты статуса ---
function classifyH2S(value){
  return H2S_THRESHOLDS.find(t => value <= t.max);
}
function classifyHours(value){
  return HOURS_THRESHOLDS.find(t => value <= t.max);
}

// --- Рендер таблицы ---
function renderTable(){
  const tbody = document.getElementById("workers-body");
  tbody.innerHTML = "";

  const data = GROUPS[currentGroup] || [];
  let criticalFound = false;

  data.forEach(row => {
    const h2s = classifyH2S(row.h2s);
    const hrs = classifyHours(row.hours);

    if (h2s.cls === "critical") criticalFound = true;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>
        <span class="badge">
          <span class="dot ${h2s.cls}"></span>${row.h2s.toFixed(0)} ppm
        </span>
      </td>
      <td class="status"><strong>${h2s.label}</strong></td>
      <td><span class="pill ${hrs.cls}">${row.hours.toFixed(1)} ч</span></td>
      <td class="status">${hrs.label}</td>
    `;
    tbody.appendChild(tr);
  });

  toggleToast(criticalFound, "⚠️ Критический уровень H₂S! Проверьте карту и эвакуируйте персонал.");
}

// --- Карта Leaflet ---
function initMap(){
  map = L.map('mapView', { zoomControl: true });
  const center = [43.355, 52.875];
  map.setView(center, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function colorForH2S(value){
  const cls = classifyH2S(value).cls;
  switch(cls){
    case "safe": return "#1f8b4c";
    case "caution": return "#b5a300";
    case "warning": return "#d98400";
    case "danger": return "#d44c52";
    case "critical": return "#c4175a";
    default: return "#8a92a6";
  }
}

function renderMarkers(){
  markersLayer.clearLayers();
  const data = GROUPS[currentGroup] || [];

  data.forEach(p => {
    const color = colorForH2S(p.h2s);
    const circle = L.circleMarker([p.lat, p.lng], {
      radius: 9, weight: 2, color: color, fillColor: color, fillOpacity: 0.75
    });

    const h2s = classifyH2S(p.h2s);
    const hrs = classifyHours(p.hours);

    circle.bindPopup(`
      <div style="font-weight:700;margin-bottom:4px">${p.name}</div>
      <div>H₂S: <b>${p.h2s.toFixed(0)} ppm</b> — ${h2s.label}</div>
      <div>Часы: <b>${p.hours.toFixed(1)} ч</b> — ${hrs.label}</div>
    `);

    circle.addTo(markersLayer);
  });
}

// --- Тост уведомления ---
function toggleToast(show, text){
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");
  if (text) toastText.textContent = text;
  toast.classList.toggle("show", !!show);
}

function wireToastClose(){
  const btn = document.getElementById("toast-close");
  btn.addEventListener("click", () => toggleToast(false));
}

// --- Переключение групп ---
function wireGroupSwitch(){
  document.querySelectorAll(".segmented-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".segmented-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentGroup = btn.dataset.group;
      renderTable();
      renderMarkers();
    });
  });
}

// --- Инициализация ---
window.addEventListener("DOMContentLoaded", () => {
  wireGroupSwitch();
  wireToastClose();
  renderTable();
  initMap();
  renderMarkers();
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const headerOffset = document.querySelector('.navbar').offsetHeight;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      smoothScrollTo(offsetPosition, 800); // ← плавная анимация 800мс
    }
  });
});

function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function scroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  }

  requestAnimationFrame(scroll);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
}
