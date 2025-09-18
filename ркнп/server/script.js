// ==== Данные (одно устройство по умолчанию) ====
const devices = [
  {
    id: 1,
    name: "НИШ ЕСП РКНП",
    h2s: 5,
    hours: 5,
    load: 60,
    lat: 43.68658,
    lng: 51.15648
  }
];

// ==== Функция — статус по H2S ====
function computeStatus(h2s) {
  // Возвращаем поля: текст, класс текста, класс строки, цвет (hex / css var)
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
  if (!el || map) return; // если карта уже есть — не пересоздаём

  map = L.map('mapView').setView([devices[0].lat, devices[0].lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}


// ==== Рендер таблицы и маркеров ====
function renderAll() {
  renderTable();
  renderMarkers();
}

function renderTable() {
  const tbody = document.getElementById('workers-body');
  if (!tbody) {
    console.error('workers-body не найден в DOM');
    return;
  }
  tbody.innerHTML = '';
  devices.forEach(d => {
    const st = computeStatus(d.h2s);
    const tr = document.createElement('tr');
    tr.className = st.rowClass;
    tr.innerHTML = `
      <td class="device-name" data-id="${d.id}">${escapeHtml(d.name)}</td>
      <td>${escapeHtml(String(d.h2s))}</td>
      <td><span class="status-indicator" style="background:${st.color}"></span><span class="${st.textClass}">${st.text}</span></td>
      <td>${escapeHtml(String(d.hours))}</td>
      <td>${escapeHtml(String(d.load))}%</td>
    `;
    tbody.appendChild(tr);
  });

  // ==== Удаление по тройному клику ====
  tbody.querySelectorAll(".device-name").forEach(cell => {
    cell.addEventListener("click", e => {
      if (e.detail === 3) { // именно тройной клик
        const id = parseInt(e.target.dataset.id);
        // фильтруем массив
        const idx = devices.findIndex(dev => dev.id === id);
        if (idx !== -1) {
          devices.splice(idx, 1);
        }
        renderAll(); // перерисовываем список и маркеры
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
        fillColor: getComputedStyle(document.documentElement).getPropertyValue(st.color) ? getComputedStyle(document.documentElement).getPropertyValue(st.color).trim() : st.color,
        color: '#000',
        weight: 1,
        fillOpacity: 0.9
      });
      marker.bindPopup(`<b>${escapeHtml(d.name)}</b><br>H₂S: ${d.h2s} ppm<br>${st.text}`);
      marker.addTo(markersLayer);
    }
  });
}

// ==== Утилиты ====
function escapeHtml(str) {
  return String(str).replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;'}[s]));
}

// ==== Обработчик формы добавления устройства ====
function setupAddForm() {
  const btn = document.getElementById('add-device-btn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.getElementById('add-name').value.trim();
    const h2s = parseFloat(document.getElementById('add-h2s').value);
    const hours = parseFloat(document.getElementById('add-hours').value) || 0;
    const lat = parseFloat(document.getElementById('add-lat').value);
    const lng = parseFloat(document.getElementById('add-lng').value);

    if (!name) { alert('Укажи имя устройства'); return; }
    if (Number.isNaN(h2s)) { alert('Укажи корректное значение H₂S (ppm)'); return; }
    if (Number.isNaN(lat) || Number.isNaN(lng)) { alert('Координаты обязательны (lat, lng)'); return; }

    const newId = devices.length ? Math.max(...devices.map(x => x.id || 0)) + 1 : 1;
    const obj = { id: newId, name, h2s, hours, load: 0, lat, lng };
    devices.push(obj);

    // очистка полей
    document.getElementById('add-name').value = '';
    document.getElementById('add-h2s').value = '';
    document.getElementById('add-hours').value = '';
    document.getElementById('add-lat').value = '';
    document.getElementById('add-lng').value = '';

    renderAll();
    // переключаемся на список, чтобы видеть добавленное
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.menu-btn[data-page="devices"]').classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('devices').classList.add('active');
  });
}

// ==== Инициализация страницы ====
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupAddForm();
  renderAll();
});
