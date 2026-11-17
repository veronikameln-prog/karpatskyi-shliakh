// Карти на Leaflet (CDN). Підкладка — топографічна OpenTopoMap (рельєф і горизонталі),
// а якщо вона недоступна — звичайна OpenStreetMap. У нічній темі плитки притлумлює CSS (.dark .leaflet-tile-pane).

const TOPO = {
  url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  options: {
    maxZoom: 15,
    subdomains: 'abc',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, SRTM | <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)',
  },
};
const OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  options: {
    maxZoom: 15,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  },
};

/** Створює карту в контейнері. Повертає null, якщо Leaflet не завантажився (тоді лишається запасний текст). */
export function createMap(container, { center, zoom = 9 } = {}) {
  const { L } = window;
  if (!L || !container) return null;
  container.replaceChildren();
  const map = L.map(container, {
    center,
    zoom,
    minZoom: 7,
    scrollWheelZoom: false, // коліщатко прокручує сторінку, а не карту
  });
  map.attributionControl.setPrefix(false);

  const topo = L.tileLayer(TOPO.url, TOPO.options).addTo(map);
  // Кілька помилок завантаження поспіль — перемикаємось на запасну підкладку
  let failed = 0;
  topo.on('tileerror', () => {
    failed += 1;
    if (failed === 4) {
      topo.remove();
      L.tileLayer(OSM.url, OSM.options).addTo(map);
    }
  });
  return map;
}

/** Кругла мітка з підписом. kind: 'start' | 'peak' | 'region'. */
export function addPin(map, latlng, label, kind = 'peak') {
  const { L } = window;
  const icon = L.divIcon({ className: '', html: `<span class="map-pin map-pin-${kind}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] });
  const marker = L.marker(latlng, { icon, keyboard: false, title: label }).addTo(map);
  if (label) marker.bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -10], className: 'map-label' });
  return marker;
}
