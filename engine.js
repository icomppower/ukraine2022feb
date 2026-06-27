/* engine.js — THE MACHINERY. Generic playback: flies the camera through the
 * SCENES / OVERLAYS that scenes.js provides, swaps captions, toggles layer
 * opacity, pauses on drag, runs the intro/audio gate. Forked from the Battle
 * of Hong Kong engine; the only subject-specific part is addOverlays(). */

let lang = 'en';
let current = 0;
let playing = false;
let started = false;
let timer = null;
let driftTimeout = null;
let drifting = false;
const FADE = {};
const sceneMarkers = [];
const FLY_DURATION = 3600;

/* Inline SVG glyphs for force-unit badges (page 8) */
const UNIT_ICONS = {
  airborne: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 4 A6 6 0 0 0 4 10 L16 10 A6 6 0 0 0 10 4Z" fill="currentColor" opacity="0.7" stroke="none"/>
    <line x1="7" y1="10" x2="10" y2="16"/>
    <line x1="13" y1="10" x2="10" y2="16"/>
    <line x1="10" y1="10" x2="10" y2="16"/>
  </svg>`,
  rapid: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="5,5 10,10 5,15"/>
    <polyline points="10,5 15,10 10,15"/>
  </svg>`
};

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
      sat: { type: 'raster',
        /* Fallback: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg' */
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256, maxzoom: 18,
        attribution: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community' },
      dem: { type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256, encoding: 'terrarium', maxzoom: 15,
        attribution: 'Elevation: Mapzen Terrain Tiles via AWS Open Data' }
    },
    layers: [{ id: 'sat', type: 'raster', source: 'sat' }]
  },
  center: SCENES[0].camera.center, zoom: SCENES[0].camera.zoom,
  pitch: SCENES[0].camera.pitch, bearing: SCENES[0].camera.bearing,
  attributionControl: false
});
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

function addOverlays() {
  for (const key in OVERLAYS) {
    if (key === 'units' || key === 'fire') continue;
    if (!map.getSource(key)) map.addSource(key, { type: 'geojson', data: OVERLAYS[key] });
  }
  const SIDE_COLOR = ['match', ['get', 'side'], 'red', '#e23b3b', 'blue', '#3b76e2', '#b9c2cf'];

  const lines = [['border', '#ffd24a', [2, 2]], ['irpin-flood', '#3b76e2', null]];
  for (const [id, color, dash] of lines) {
    if (!OVERLAYS[id]) continue;
    map.addLayer({ id, source: id, type: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': 3, 'line-opacity': 0.9, ...(dash ? { 'line-dasharray': dash } : {}) } });
    FADE[id] = [['line-opacity', 0.9]];
  }

  const arrowLayers = ['heli-route', 'ru-ground', 'ua-counter', 'ru-airborne2'];
  for (const id of arrowLayers) {
    if (!OVERLAYS[id]) continue;
    map.addLayer({ id, source: id, type: 'line', layout: { 'line-cap': 'round' },
      paint: { 'line-color': SIDE_COLOR, 'line-width': 3.5, 'line-opacity': 0.95 } });
    FADE[id] = [['line-opacity', 0.95]];
    map.addLayer({ id: id + '-head', source: id, type: 'symbol',
      layout: { 'symbol-placement': 'line-center', 'text-field': '▶', 'text-size': 16,
        'text-rotation-alignment': 'map', 'text-keep-upright': false, 'text-allow-overlap': true },
      paint: { 'text-color': SIDE_COLOR, 'text-halo-color': '#000', 'text-halo-width': 1, 'text-opacity': 1 } });
    FADE[id + '-head'] = [['text-opacity', 1]];
  }

  for (const id of ['airfield']) {
    if (!OVERLAYS[id]) continue;
    map.addLayer({ id, source: id, type: 'fill',
      paint: { 'fill-color': '#ffd24a', 'fill-opacity': 0.18, 'fill-outline-color': '#ffd24a' } });
    FADE[id] = [['fill-opacity', 0.18]];
  }
  addPointMarkers();
}

function addPointMarkers() {
  sceneMarkers.length = 0;
  for (const f of OVERLAYS.units.features) {
    const props = f.properties;
    const wrap = document.createElement('div');
    wrap.className = 'unit-marker ' + (props.side || '');

    if (props.kind && UNIT_ICONS[props.kind]) {
      const badge = document.createElement('span');
      badge.className = 'iconmark ' + (props.side || '');
      badge.innerHTML = UNIT_ICONS[props.kind];
      const label = document.createElement('span'); label.className = 'lbl';
      label.textContent = props.name || '';
      wrap.append(badge, label);
    } else {
      const dot = document.createElement('span'); dot.className = 'dotmark';
      const label = document.createElement('span'); label.className = 'lbl';
      label.textContent = props.name || '';
      wrap.append(dot, label);
    }

    new maplibregl.Marker({ element: wrap, anchor: 'center' }).setLngLat(f.geometry.coordinates).addTo(map);
    if (props.scenes) sceneMarkers.push({ el: wrap, scenes: props.scenes });
  }

  /* Fire / ember markers */
  if (OVERLAYS.fire) {
    for (const f of OVERLAYS.fire.features) {
      const el = document.createElement('div'); el.className = 'fire-marker';
      const ember = document.createElement('span'); ember.className = 'ember';
      el.appendChild(ember);
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(f.geometry.coordinates).addTo(map);
      if (f.properties.scenes) sceneMarkers.push({ el, scenes: f.properties.scenes });
    }
  }
}

function updateMarkers() {
  for (const { el, scenes } of sceneMarkers) {
    el.style.opacity = scenes.includes(current) ? '1' : '0';
  }
}

function applyLayers() {
  const show = new Set(SCENES[current].show || []);
  for (const id in FADE) {
    if (!map.getLayer(id)) continue;
    const base = id.replace(/-head$/, '');
    const on = show.has(id) || show.has(base);
    for (const [prop, full] of FADE[id]) map.setPaintProperty(id, prop, on ? full : 0);
  }
}

const els = {
  caption: document.getElementById('caption'), date: document.getElementById('date'),
  tag: document.getElementById('tag'), playBtn: document.getElementById('playBtn'),
  dots: document.getElementById('dots')
};
const TAG_LABEL = { verified: 'VERIFIED', approx: 'APPROX.', contested: 'CONTESTED' };

function renderCaption() {
  const s = SCENES[current];
  els.caption.textContent = s.caption; els.date.textContent = s.date;
  if (els.tag) { els.tag.textContent = s.tag ? (TAG_LABEL[s.tag] || s.tag) : '';
    els.tag.className = 'tag' + (s.tag ? ' ' + s.tag : ''); }
}

function renderDots() {
  els.dots.innerHTML = '';
  SCENES.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === current ? ' active' : '');
    d.title = SCENES[i].date; d.onclick = () => { goTo(i); };
    els.dots.appendChild(d);
  });
}

function stopDrift() {
  clearTimeout(driftTimeout); driftTimeout = null;
  if (drifting) { map.stop(); drifting = false; }
}

function startDrift(s) {
  const remaining = s.duration - FLY_DURATION - 200;
  if (remaining < 1000) return;
  driftTimeout = setTimeout(() => {
    if (!playing) return;
    drifting = true;
    map.easeTo({ bearing: map.getBearing() + 6, duration: remaining, easing: t => t });
  }, FLY_DURATION + 100);
}

function playScene(i, instant) {
  current = Math.max(0, Math.min(i, SCENES.length - 1));
  const s = SCENES[current];
  stopDrift();
  map.flyTo({ ...s.camera, duration: instant ? 0 : FLY_DURATION, essential: true, curve: 1.6 });
  applyLayers(); updateMarkers(); renderCaption(); renderDots();
  if (!instant) startDrift(s);
  clearTimeout(timer);
  if (playing && current < SCENES.length - 1) timer = setTimeout(() => playScene(current + 1), s.duration);
  if (playing && current === SCENES.length - 1) setTimeout(() => { playing = false; updatePlayBtn(); }, s.duration);
  updatePlayBtn();
}
function goTo(i) { playing = true; playScene(i); }
function updatePlayBtn() {
  els.playBtn.textContent = playing ? '❚❚' : '►';
  els.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function renderSources() {
  const ul = document.getElementById('sourceList'); ul.innerHTML = '';
  (SOURCES[lang] || []).forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
}

const music = document.getElementById('music');
function startTour() {
  if (started) return; started = true;
  document.getElementById('intro').classList.add('hidden');
  ensureOverlays(); playing = true; playScene(0);
  if (music) { music.volume = 0.5; music.play().catch(() => {}); }
}

let overlaysReady = false;
function ensureOverlays() {
  if (overlaysReady) return;
  if (!map.isStyleLoaded()) { map.once('idle', ensureOverlays); return; }
  overlaysReady = true; addOverlays();
}
map.on('load', () => {
  map.setTerrain({ source: 'dem', exaggeration: 2.6 });
  map.setSky({
    'sky-color': '#1a2233',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#8db4d4',
    'horizon-fog-blend': 0.5,
    'fog-color': '#2c3a5a',
    'fog-ground-blend': 0.9
  });
  ensureOverlays();
});
map.on('dragstart', () => { playing = false; clearTimeout(timer); stopDrift(); updatePlayBtn(); });

els.playBtn.onclick = () => {
  if (!started) { startTour(); return; }
  playing = !playing;
  if (playing) playScene(current); else { clearTimeout(timer); stopDrift(); }
  updatePlayBtn();
};
document.getElementById('prevBtn').onclick = () => goTo(current - 1);
document.getElementById('nextBtn').onclick = () => goTo(current + 1);
document.getElementById('startBtn').onclick = startTour;
const sourcesPanel = document.getElementById('sources');
document.getElementById('sourcesBtn').onclick = () => sourcesPanel.classList.toggle('open');
document.getElementById('closeSources').onclick = () => sourcesPanel.classList.remove('open');
window.addEventListener('keydown', e => {
  if (!started) return;
  if (e.code === 'Space') { e.preventDefault(); els.playBtn.click(); }
  if (e.code === 'ArrowRight') goTo(current + 1);
  if (e.code === 'ArrowLeft') goTo(current - 1);
});

renderSources(); renderCaption(); renderDots(); updatePlayBtn();
