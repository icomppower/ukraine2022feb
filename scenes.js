/* scenes.js — THE CONTENT. Pure data; rewrite the narrative here without
 * touching engine.js. Per scene: date, evidence tag, camera (flyTo target),
 * duration, caption, and `show` (line/arrow/zone ids to reveal). Subject: the
 * Kyiv axis, first 48h of the invasion, 24–25 Feb 2022. Sides: red=Russian,
 * blue=Ukrainian, grey=contested/civilian. Coordinates are approximate. */

const SCENES = [
  { date: '24 Feb 2022 · ~05:00', tag: 'verified',
    camera: { center: [30.45, 50.62], zoom: 8.4, pitch: 42, bearing: 0 }, duration: 9500, show: ['border'],
    caption: 'Before dawn on 24 February 2022, Russia announced the “special military operation” at ~05:30. Between 06:00 and 07:00, Kalibr cruise missiles struck Antonov Airport and the nearby National Guard base — the war reached Hostomel on day one, hour one.' },
  { date: '24 Feb · ~09:30', tag: 'verified',
    camera: { center: [30.36, 50.86], zoom: 9.3, pitch: 56, bearing: -28 }, duration: 9500, show: ['heli-route'],
    caption: 'A formation of 20–34 Russian helicopters — Ka-52 gunships and Mi-8 transports — left Bolshoy Bokov airfield in Belarus at ~09:30 and flew low up the Dnipro corridor. Ukrainian small-arms and MANPADS fire hit the formation en route; at least two aircraft were downed, including a Ka-52 whose crew ejected. The survivors pressed on.' },
  { date: '24 Feb · ~11:00', tag: 'verified',
    camera: { center: [30.192, 50.603], zoom: 12.3, pitch: 60, bearing: 22 }, duration: 9500, show: ['heli-route', 'airfield'],
    caption: 'Survivors arrived over Hostomel at ~11:00. Ka-52s rocketed the field perimeter to suppress the garrison — ~200–300 troops of Ukraine\'s 4th Rapid Reaction Brigade, garrisoned there only since 23 February. Some 200–300 VDV paratroopers of the 31st Guards Air Assault and 45th Guards Spetsnaz assaulted from the transports, aiming to seize the runway and open an airbridge to Kyiv.' },
  { date: '24 Feb · ~15:30', tag: 'contested',
    camera: { center: [30.20, 50.605], zoom: 12.9, pitch: 62, bearing: 36 }, duration: 9500, show: ['ua-counter', 'airfield'],
    caption: 'General Zaluzhny ordered the 72nd Mechanized Brigade to counterattack, supported by the 4th Rapid Reaction Brigade, the Georgian Legion, and Su-24/MiG-29 air support. Russian VDV had no armor on Day 1 — they depended entirely on Ka-52 and Su-25 air cover. Control of the field was contested through the afternoon.' },
  { date: '24 Feb · evening', tag: 'verified',
    camera: { center: [30.20, 50.60], zoom: 12.1, pitch: 54, bearing: 10 }, duration: 9000, show: ['airfield'],
    caption: '18 Il-76 transport aircraft carrying reinforcements could not land on the cratered, contested runway and turned back. The planned airbridge failed on Day 1. Whatever the exact overnight control, the field could no longer receive the heavy lift the operation depended on.' },
  { date: '24 Feb · afternoon', tag: 'verified',
    camera: { center: [30.10, 51.18], zoom: 8.5, pitch: 46, bearing: -10 }, duration: 9000, show: ['border', 'ru-ground'],
    caption: "To the north, Russian ground forces crossed from Belarus through the Chornobyl exclusion zone and seized the Chornobyl nuclear plant, opening an overland route south toward Hostomel." },
  { date: '25 Feb', tag: 'approx',
    camera: { center: [29.95, 50.95], zoom: 10.2, pitch: 56, bearing: 6 }, duration: 9000, show: ['ru-ground'],
    caption: "The armored column pushed toward Ivankiv and the bridge over the Teteriv. Ukrainian forces fought to delay it; some vehicles were ambushed before they reached Hostomel." },
  { date: '25 Feb', tag: 'verified',
    camera: { center: [30.20, 50.605], zoom: 12.3, pitch: 60, bearing: -8 }, duration: 9500, show: ['ru-ground', 'ru-airborne2', 'airfield'],
    caption: "A second airborne assault joined the ground reinforcements, and Russian forces took the airport on 25 February. But with the runway wrecked the airbridge was already defeated — troops now had to come overland." },
  { date: '25–26 Feb · night', tag: 'contested',
    camera: { center: [30.327, 50.241], zoom: 10.8, pitch: 54, bearing: 16 }, duration: 9000, show: [],
    caption: "South of Kyiv, the air base at Vasylkiv was put on alert and saw night fighting. Ukraine claimed to down a Russian Il-76 transport carrying paratroopers nearby — a claim that remains unconfirmed." },
  { date: '25 Feb', tag: 'verified',
    camera: { center: [30.40, 50.53], zoom: 9.9, pitch: 50, bearing: -12 }, duration: 11000, show: ['irpin-flood'],
    caption: "Kyiv braced under curfew. Ukrainian engineers flooded the Irpin River to block the western approaches, and fighting shifted toward Bucha and Irpin. The bid to seize the capital in a single stroke had failed; the advance ground on overland." }
];

/* OVERLAYS — inline GeoJSON. Each Feature's `layer` maps to a scene `show` id;
 * arrows/markers carry a `side` (red/blue/grey). All coords approximate. */
const OVERLAYS = {
  border: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'border' },
    geometry: { type: 'LineString', coordinates: [[29.20,51.50],[29.70,51.58],[30.20,51.55],[30.70,51.58],[31.20,51.55]] } }] },
  'irpin-flood': { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'irpin-flood' },
    geometry: { type: 'LineString', coordinates: [[30.30,50.70],[30.30,50.61],[30.31,50.53],[30.33,50.46]] } }] },
  'heli-route': { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'heli-route', side: 'red' },
    geometry: { type: 'LineString', coordinates: [[29.70,51.58],[30.05,51.20],[30.45,50.96],[30.49,50.64],[30.32,50.61],[30.205,50.604]] } }] },
  'ru-ground': { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'ru-ground', side: 'red' },
    geometry: { type: 'LineString', coordinates: [[29.75,51.55],[30.02,51.39],[29.96,51.10],[29.90,50.94],[30.10,50.79],[30.19,50.62]] } }] },
  'ua-counter': { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { layer: 'ua-counter', side: 'blue' }, geometry: { type: 'LineString', coordinates: [[30.27,50.57],[30.23,50.59],[30.20,50.602]] } },
    { type: 'Feature', properties: { layer: 'ua-counter', side: 'blue' }, geometry: { type: 'LineString', coordinates: [[30.15,50.56],[30.18,50.586],[30.19,50.602]] } } ] },
  'ru-airborne2': { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'ru-airborne2', side: 'red' },
    geometry: { type: 'LineString', coordinates: [[30.25,50.66],[30.22,50.63],[30.198,50.607]] } }] },
  airfield: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { layer: 'airfield' },
    geometry: { type: 'Polygon', coordinates: [[[30.160,50.612],[30.230,50.612],[30.232,50.595],[30.162,50.595],[30.160,50.612]]] } }] },
  units: { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { layer: 'units', side: 'grey', name: 'Antonov Airport (Hostomel)' }, geometry: { type: 'Point', coordinates: [30.192,50.603] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Hostomel' }, geometry: { type: 'Point', coordinates: [30.262,50.649] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Kyiv' }, geometry: { type: 'Point', coordinates: [30.524,50.450] } },
    { type: 'Feature', properties: { layer: 'units', side: 'grey', name: 'Chornobyl NPP' }, geometry: { type: 'Point', coordinates: [30.099,51.389] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Ivankiv' }, geometry: { type: 'Point', coordinates: [29.894,50.939] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Bucha' }, geometry: { type: 'Point', coordinates: [30.224,50.544] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Irpin' }, geometry: { type: 'Point', coordinates: [30.247,50.530] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', name: 'Vasylkiv air base' }, geometry: { type: 'Point', coordinates: [30.327,50.241] } },
    { type: 'Feature', properties: { layer: 'units', side: 'grey', name: 'Boryspil airport' }, geometry: { type: 'Point', coordinates: [30.895,50.345] } },
    /* Force markers — VDV airborne (arrival-gated), garrison static, 72nd Mech via FX */
    { type: 'Feature', properties: { layer: 'units', side: 'red', kind: 'airborne', name: 'VDV 31st Gds / 45th Spetsnaz', scenes: [2,3,4,7] }, geometry: { type: 'Point', coordinates: [30.180,50.610] } },
    { type: 'Feature', properties: { layer: 'units', side: 'blue', kind: 'rapid', name: '4th Rapid Reaction Bde (garrison)', scenes: [2,3] }, geometry: { type: 'Point', coordinates: [30.185,50.608] } }
  ] },
  /* Combat ember markers — Antonov removed (artillery FX covers it); Ivankiv + Vasylkiv remain */
  fire: { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { layer: 'fire', scenes: [6] }, geometry: { type: 'Point', coordinates: [29.894,50.939] } },
    { type: 'Feature', properties: { layer: 'fire', scenes: [8] }, geometry: { type: 'Point', coordinates: [30.327,50.241] } }
  ] }
};

/* FX — animated markers. Scene indices are 0-based. */
const FX = {
  heliRoute:   OVERLAYS['heli-route'].features[0].geometry.coordinates,
  heliAt:      [30.205, 50.604],
  flyScene:    2,            /* landing happens in the ASSAULT scene (idx 2) */
  transitFrac: 0.70,         /* approach (idx 1) animates route 0 → transitFrac */
  heliScenes:  [1, 2],
  flyMs:       9000,         /* ms for the FULL route (0 → 1) */
  /* Formation: Ka-52 leads and is shot down; two Mi-8 transports survive */
  helicopters: [
    { role: 'gunship',   label: 'Ka-52', lagMs: 0,    offset: [-0.004,  0.004], fate: 'downed',  downAtFrac: 0.55 },
    { role: 'transport', label: 'Mi-8',  lagMs: 900,  offset: [ 0.000,  0.000], fate: 'survive' },
    { role: 'transport', label: 'Mi-8',  lagMs: 1800, offset: [ 0.004, -0.003], fate: 'survive' }
  ],
  egress: { delayMs: 3500, flyMs: 6000 }, /* survivors lift off and fly back north */
  /* Paratroopers drop on landing (scene 2 only); ground soldiers shown 2,3,7 */
  paratroopers: { at: [30.192, 50.603], scenes: [2] },
  groundScenes: [2, 3, 7],
  /* Artillery flash */
  artillery: { positions: [[30.205, 50.600], [30.218, 50.608]], scenes: [3, 4, 7] },
  /* Kalibr opening strikes (scene 0) — reuse arty flash style */
  kalibr: { positions: [[30.192, 50.603], [30.208, 50.614]], scenes: [0] },
  /* 72nd Mechanized Bde armored advance — halts short of airfield */
  rapidForce: {
    route:  [[30.27, 50.57], [30.245, 50.58], [30.228, 50.588]],
    scenes: [3, 4],
    flyMs:  9000,
    label:  '72nd Mech Bde'
  }
};

/* SOURCES — bibliography + evidence-tag key (rendered in the Sources panel). */
const SOURCES = { en: [
  'Evidence tags — VERIFIED: corroborated by multiple independent sources. APPROX.: broadly reported, exact positions/timings uncertain. CONTESTED: disputed, or a single-source / official claim.',
  'Institute for the Study of War (ISW) — Russian Offensive Campaign Assessments, 24–25 February 2022.',
  'M. Zabrodskyi, J. Watling, O. Danylyuk & N. Reynolds, "Preliminary Lessons in Conventional Warfighting from Russia\'s Invasion of Ukraine: February–July 2022," RUSI, 2022.',
  'Center for a New American Security (CNAS) — analysis of the battle for Hostomel / Antonov Airport.',
  'Contemporary reporting, Reuters / AP / BBC, 24–25 February 2022.',
  'Ukrainian Ministry of Defence and General Staff statements — claims attributed and tagged contested where unconfirmed.',
  'Imagery: Sentinel-2 cloudless 2016 © EOX IT Services (CC BY 4.0). Terrain: AWS Terrain Tiles (Mapzen Terrarium DEM). Present-day; positions approximate.'
] };
