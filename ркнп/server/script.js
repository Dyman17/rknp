// ==== Глобальный массив устройств ====
let devices = [
  {
    id: 1,
    name: "Айдар",
    h2s: 8,
    hours: 3,
    load: 40,
    lat: 43.68649 ,
    lng: 51.15596 
  },
  {
    id: 2,
    name: "Марат",
    h2s: 15,
    hours: 5,
    load: 65,
    lat: 43.68628 ,
    lng: 51.15679 
  },
  {
    id: 3,
    name: "Айгерим апай",
    h2s: 49,
    hours: 7,
    load: 90,
    lat: 43.64288 ,
    lng: 51.16636 
  }
];

// ==== Функция — статус по H2S ====
function computeStatus(h2s) {
  if (h2s <= 10) return { text: "Норма", textClass: "text-safe", rowClass: "row-safe", color: "var(--safe)" };
  if (h2s <= 20) return { text: "Уровень 1", textClass: "text-level1", rowClass: "row-level1", color: "var(--level1)" };
  if (h2s <= 30) return { text: "Уровень 2", textClass: "text-level2", rowClass: "row-level2", color: "var(--level2)" };
  return { text: "Уровень 3", textClass: "text-level3", rowClass: "row-level3", color: "var(--level3)" };
}

// ==== Переключение страниц верхнего меню ====
const menuButtons = document.querySelectorAll('.menu-btn');
const pages = document.querySelectorAll('.page');
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    menuButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    const target = btn.dataset.page;
    document.getElementById(target)?.classList.add('active');
    if (target === 'map' && map) {
      setTimeout(() => map.invalidateSize(), 200);
    }
  });
});

// ==== Карта и слой маркеров ====
let map = null;
let markersLayer = null;

function initMap() {
  const el = document.getElementById('mapView');
  if (!el || map) return;

  map = L.map('mapView').setView([43.68658, 51.15648], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

// ==== Получение данных с сервера ====
// ==== Получение данных с сервера или фейковых ====
async function fetchDevices() {
  try {
    // Если сервер есть, можно тут делать fetch(...)
    // А пока просто перерисовываем существующий массив
    renderAll();
  } catch (err) {
    console.error("Ошибка:", err);
  }
}
// ==== Рендер таблицы и маркеров ====
function renderAll() {
  renderTable();
  renderMarkers();
}

function renderTable() {
  const tbody = document.getElementById('workers-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  devices.forEach(d => {
    const st = computeStatus(d.h2s);
    const tr = document.createElement('tr');
    tr.className = st.rowClass;
    tr.innerHTML = `
      <td class="device-name" data-id="${d.id}">${escapeHtml(d.name)}</td>
      <td>${escapeHtml(String(d.h2s))}</td>
      <td><span class="status-indicator" style="background:${st.color}"></span><span class="${st.textClass}">${st.text}</span></td>
      <td>${escapeHtml(String(d.hours || 0))}</td>
      <td>${escapeHtml(String(d.load || 0))}%</td>
    `;
    tbody.appendChild(tr);

    // ==== Удаление по тройному клику ====
    tr.querySelector(".device-name").addEventListener("click", e => {
      if (e.detail === 3) {
        devices = devices.filter(dev => dev.id !== d.id);
        renderAll();
      }
    });
  });
}

function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  devices.forEach(d => {
    if (typeof d.lat === 'number' && typeof d.lng === 'number') {
      const st = computeStatus(d.h2s);
      const marker = L.circleMarker([d.lat, d.lng], {
        radius: 8,
        fillColor: getComputedStyle(document.documentElement).getPropertyValue(st.color) || st.color,
        color: '#000',
        weight: 1,
        fillOpacity: 0.9
      });
      marker.bindPopup(`<b>${escapeHtml(d.name)}</b><br>H₂S: ${d.h2s} ppm<br>${st.text}`);
      marker.addTo(markersLayer);
    }
  });
}

// ==== Утилита для экранирования ====
function escapeHtml(str) {
  return String(str).replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;'}[s]));
}

// ==== Инициализация страницы ====
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchDevices();
  setInterval(fetchDevices, 2000); // автообновление
});



