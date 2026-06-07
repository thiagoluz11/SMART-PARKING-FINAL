/**
 * MAP — Smart Parking
 * Módulo de mapa interativo usando Leaflet.js
 * Ficheiro: assets/js/map.js
 */

const MapModule = (() => {

  let _map = null;
  let _markers = [];
  let _onParkSelect = null;

  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

  // ── Ícone com cor consoante ocupação ──────────────────────────────────
  const _createIcon = (available, capacity) => {
    const pct = ((capacity - available) / capacity) * 100;
    let color = '#4caf7d';
    if (pct >= 80) color = '#e05252';
    else if (pct >= 50) color = '#f5a623';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".4"/></filter>
        <path filter="url(#s)" fill="${color}" d="M18 0C8 0 0 8 0 18c0 12 18 26 18 26S36 30 36 18C36 8 28 0 18 0z"/>
        <circle fill="#111" cx="18" cy="18" r="10"/>
        <text x="18" y="22" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="${color}">P</text>
      </svg>`;

    return L.divIcon({
      html: svg,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -46],
      className: ''
    });
  };

  // ── Popup de cada parque ──────────────────────────────────────────────
  const _popupHTML = (park) => {
    const pct = Math.round(((park.capacity - park.available) / park.capacity) * 100);
    const barColor = pct >= 80 ? '#e05252' : pct >= 50 ? '#f5a623' : '#4caf7d';
    return `
      <div style="
        font-family:Inter,sans-serif;
        background:#1a1a1a;
        color:#f0f0f0;
        border-radius:12px;
        padding:14px 16px;
        min-width:220px;
        box-shadow:0 4px 20px rgba(0,0,0,.6);
      ">
        <div style="font-family:Syne,sans-serif;font-size:1rem;font-weight:800;margin-bottom:4px">${park.name}</div>
        <div style="font-size:0.78rem;color:#888;margin-bottom:10px">📍 ${park.address}</div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:0.8rem;color:#888">Ocupação</span>
          <span style="font-size:0.85rem;font-weight:700;color:${barColor}">${pct}%</span>
        </div>
        <div style="background:#2a2a2a;border-radius:6px;height:6px;margin-bottom:10px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:6px"></div>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#888;margin-bottom:12px">
          <span>🕐 ${park.open} – ${park.close}</span>
          <span style="color:#4caf7d;font-weight:600">${park.available} livres</span>
        </div>

        <button
          onclick="MapModule.selectPark(${park.id})"
          style="
            width:100%;
            padding:8px;
            background:#f5a623;
            color:#111;
            border:none;
            border-radius:8px;
            font-weight:700;
            font-size:0.85rem;
            cursor:pointer;
            font-family:Inter,sans-serif;
          ">
          Reservar aqui →
        </button>
      </div>`;
  };

  // ── Inicializar mapa ──────────────────────────────────────────────────
  const init = (containerId, parks, onParkSelectCallback) => {
    if (_map) { _map.remove(); _map = null; }

    _onParkSelect = onParkSelectCallback || null;

    _map = L.map(containerId, {
      center: [41.157, -8.629],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(_map);

    _map.attributionControl.setPrefix('');

    _addMarkers(parks);
  };

  // ── Adicionar markers ─────────────────────────────────────────────────
  const _addMarkers = (parks) => {
    _markers.forEach(m => m.remove());
    _markers = [];

    parks.forEach(park => {
      if (!park.lat || !park.lng) return;

      const marker = L.marker([park.lat, park.lng], {
        icon: _createIcon(park.available, park.capacity),
        title: park.name,
      }).addTo(_map);

      marker.bindPopup(_popupHTML(park), {
        maxWidth: 260,
        className: 'sp-popup',
      });

      marker.on('click', () => marker.openPopup());
      _markers.push(marker);
    });

    if (_markers.length > 1) {
      const group = L.featureGroup(_markers);
      _map.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // ── Atualizar markers (após pesquisa/filtro) ──────────────────────────
  const updateParks = (parks) => {
    if (!_map) return;
    _addMarkers(parks);
  };

  // ── Focar num parque (flyTo + abrir popup) ────────────────────────────
  const focusPark = (park) => {
    if (!_map || !park.lat || !park.lng) return;
    _map.flyTo([park.lat, park.lng], 15, { duration: 0.8 });
    const marker = _markers.find(m => {
      const pos = m.getLatLng();
      return pos.lat === park.lat && pos.lng === park.lng;
    });
    if (marker) setTimeout(() => marker.openPopup(), 900);
  };

  // ── Chamado pelo botão "Reservar aqui" dentro do popup ────────────────
  const selectPark = (parkId) => {
    if (_onParkSelect) _onParkSelect(parkId);
  };

  // ── Destruir mapa ─────────────────────────────────────────────────────
  const destroy = () => {
    if (_map) { _map.remove(); _map = null; }
    _markers = [];
  };

  return { init, updateParks, focusPark, selectPark, destroy };

})();

window.MapModule = MapModule;