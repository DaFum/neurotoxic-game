/* NEUROTOXIC — Asset Hub Redesign · Mock-Spielstand + echte Daten aus dem Repo
   Texte aus public/locales/de/assets.json, Slot-Positionen aus
   src/utils/assetSections/*Config.ts, Prompts aus src/utils/imageGen.ts */

;(function () {
  // ── Pollinations Bildgenerator (exakt wie src/utils/imageGen.ts) ──
  const BASE_URL = 'https://gen.pollinations.ai/image'
  const MODEL = 'flux'
  const KEY = 'pk_xDL8u2ty4Sxucaa3'
  function genImageUrl(desc, w, h) {
    const enc = encodeURIComponent(desc)
    let url = `${BASE_URL}/${enc}?model=${MODEL}&seed=666&key=${KEY}&=`
    if (w && h) url += `&width=${w}&height=${h}`
    return url
  }
  // default module prompt (wie imageGen.defaultModulePrompt)
  function modulePrompt(name) {
    return `pixel art ${name.toLowerCase()} dark moody toxic green accents`
  }

  // ── Status ──
  const STATUS = { cash: 1240, daily: -85, debt: 3400, campaigns: 0 }

  // ── Kredite ──
  const LIABILITIES = [
    {
      id: 'loan-1',
      source: 'loan',
      label: 'Kredit',
      dailyPayment: 85,
      principalRemaining: 3400,
      termDaysRemaining: 38,
      defaultCounter: 0
    }
  ]

  // ── Modul-Pools je Slot-Typ (echte Module + Effekte) ──
  const M = (id, name, desc, cost, opts = {}) => ({
    id,
    name,
    desc,
    cost,
    ...opts
  })
  const POOLS = {
    tb_roof: [
      M('tb_solar_panel', 'Solarpanel', 'Senkt Spritverbrauch um 15%', 420),
      M('tb_roof_rack', 'Dachgepäckträger', '+30 Merch-Kapazität', 180)
    ],
    tb_audio: [
      M(
        'tb_subwoofer_stack',
        'Subwoofer-Stack',
        '+10% Trinkgeld bei Gigs',
        340
      ),
      M('tb_vintage_stereo', 'Vintage-Stereo', '+2 Band-Stimmung pro Tag', 220)
    ],
    tb_front: [
      M('tb_cb_radio_mesh', 'CB-Funk-Mesh', 'Optimiert Routen, -5% Sprit', 150),
      M('tb_gps_jammer', 'GPS-Störer', 'Halbiert Polizei-Risiko', 500, {
        lock: 'Benötigt Szene-Präsenz 30'
      })
    ],
    tb_side: [
      M(
        'tb_side_graphics',
        'Seitengrafik',
        'Großes Bandlogo, +0,3 Fame/Tag',
        260
      ),
      M('tb_neon_underglow', 'Neon-Unterboden', '+0,4 Fame pro Tag', 300)
    ],
    tb_interior_cabin: [
      M('tb_sleeping_bunks', 'Schlafkojen', '+5 Stamina-Regen unterwegs', 480),
      M('tb_mini_fridge', 'Mini-Kühlschrank', '+1 Band-Stimmung pro Tag', 140),
      M('tb_espresso_machine', 'Espressomaschine', '+3 Stamina-Regen', 260)
    ],
    tb_decal: [
      M('tb_fox_tail', 'Fuchsschwanz', '+0,2 Fame pro Tag, pures Image', 60),
      M('tb_alloy_rims', 'Alufelgen', '+0,5 Fame passiv pro Tag', 520)
    ],
    st_control: [
      M('st_diy_mixer', 'DIY-Mixer', 'Senkt Aufnahmekosten', 300),
      M('st_ssl_console', 'SSL Console', '+20% Song-Qualität', 2400, {
        lock: 'Benötigt 50 Fame'
      })
    ],
    st_mic: [
      M(
        'st_dynamic_workhorse_mic',
        'Dynamisches Mikrofon',
        'Günstigere Sessions',
        160
      ),
      M('st_u87_mic', 'Neumann U87', '+8% Song-Qualität', 900)
    ],
    st_monitoring: [
      M('st_ns10_monitors', 'Yamaha NS-10 Monitore', '+5% Song-Qualität', 480)
    ],
    st_software: [
      M(
        'st_cracked_daw_bundle',
        'Gecrackte DAW',
        'Halbe Kosten, Copyright-Risiko',
        0
      ),
      M('st_pro_tools_hd', 'Pro Tools HD', 'Ermöglicht Re-Recording', 700)
    ],
    mw_print: [
      M('mw_manual_press', 'Handdruckpresse', '-10% Merch-Kosten', 240),
      M('mw_4color_carousel', '4-Farb-Karussell', '-25% Merch-Kosten', 1200, {
        lock: 'Benötigt 40 Fame'
      })
    ],
    mw_drying: [
      M('mw_conveyor_dryer', 'Förderband-Trockner', '+30 Merch-Kapazität', 360)
    ],
    mw_sales: [
      M('mw_bandcamp_bot', 'Bandcamp-Bot', '+25 EUR/Tag', 300),
      M('mw_mailorder_script', 'Mailorder-Skript', '+30 EUR/Tag', 280)
    ],
    mw_storage: [
      M('mw_storage_racks', 'Lagerregale', '+60 Merch-Kapazität', 220)
    ]
  }

  // ── Sektionen mit Slot-Layout auf dem Hero-Bild ──
  // layout 'point' → runde Hotspots (Tourbus); 'zone' → gestrichelte Rechtecke.
  // Positionen 1:1 aus *Config.ts (normalisiert 0..1 über dem Hintergrundbild).
  const SECTIONS = {
    tourbus_chassis: {
      key: 'tourbus_chassis',
      short: 'tourbus',
      tabLabel: 'Tourbus',
      icon: 'bus',
      accent: '#00ff41',
      title: 'Tourbus',
      desc: 'Deine rollende Bühne',
      heroPrompt:
        'pixel art tour van side view band gear background wide shot atmospheric dark moody toxic green accents',
      heroAlt: 'Tourbus',
      heroAspect: '16 / 9',
      layout: 'point',
      owned: true,
      flavor: 'Legit',
      tier: 'Tier III',
      condition: 64,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          name: 'Dach',
          installed: 'tb_solar_panel',
          pos: { x: 0.5, y: 0.18 }
        },
        {
          id: 's2',
          slotType: 'tb_side',
          name: 'Seite',
          installed: 'tb_side_graphics',
          pos: { x: 0.55, y: 0.45 }
        },
        {
          id: 's3',
          slotType: 'tb_audio',
          name: 'Audio',
          installed: 'tb_subwoofer_stack',
          pos: { x: 0.45, y: 0.65 }
        },
        {
          id: 's4',
          slotType: 'tb_front',
          name: 'Front',
          installed: null,
          pos: { x: 0.85, y: 0.55 }
        },
        {
          id: 's5',
          slotType: 'tb_interior_cabin',
          name: 'Kabine',
          installed: null,
          pos: { x: 0.35, y: 0.5 }
        },
        {
          id: 's6',
          slotType: 'tb_decal',
          name: 'Lackierung',
          installed: null,
          pos: { x: 0.5, y: 0.8 }
        }
      ]
    },
    studio_chassis: {
      key: 'studio_chassis',
      short: 'studio',
      tabLabel: 'Studio',
      icon: 'sliders',
      accent: '#3b82f6',
      title: 'Aufnahmestudio',
      desc: 'Wo die Songs aufgenommen werden',
      heroPrompt:
        'pixel art cellar studio cables everywhere background wide shot atmospheric dark moody toxic green accents',
      heroAlt: 'Studio-Grundriss',
      heroAspect: '4 / 3',
      layout: 'zone',
      owned: true,
      flavor: 'DIY',
      tier: 'Tier I',
      condition: 88,
      slots: [
        {
          id: 's1',
          slotType: 'st_control',
          name: 'Mischpult',
          installed: 'st_diy_mixer',
          zone: { x: 0.5, y: 0.55, w: 0.3, h: 0.2 }
        },
        {
          id: 's2',
          slotType: 'st_monitoring',
          name: 'Monitore',
          installed: 'st_ns10_monitors',
          zone: { x: 0.5, y: 0.3, w: 0.2, h: 0.1 }
        },
        {
          id: 's3',
          slotType: 'st_mic',
          name: 'Mikrofon',
          installed: null,
          zone: { x: 0.2, y: 0.3, w: 0.15, h: 0.2 }
        },
        {
          id: 's4',
          slotType: 'st_software',
          name: 'DAW',
          installed: null,
          zone: { x: 0.2, y: 0.7, w: 0.2, h: 0.15 }
        }
      ]
    },
    bandhaus_chassis: {
      key: 'bandhaus_chassis',
      short: 'bandhaus',
      tabLabel: 'Bandhaus',
      icon: 'house',
      accent: '#8b5cf6',
      title: 'Bandhaus',
      desc: 'HQ, Schlafen, Gartenanbau',
      heroPrompt:
        'pixel art squatted band house cross section graffiti background wide shot atmospheric dark moody toxic green accents',
      heroAlt: 'Bandhaus-Querschnitt',
      heroAspect: '3 / 4',
      layout: 'zone',
      owned: false,
      acquire: { priceLegit: 5800, priceDiy: 2400 }
    },
    merch_workshop_chassis: {
      key: 'merch_workshop_chassis',
      short: 'workshop',
      tabLabel: 'Werkstatt',
      icon: 'shirt',
      accent: '#ffcc00',
      title: 'Merch-Werkstatt',
      desc: 'Drucken, Verpacken, Versenden',
      heroPrompt:
        'pixel art merch workshop production line background wide shot atmospheric dark moody toxic green accents',
      heroAlt: 'Produktionslinie der Merch-Werkstatt',
      heroAspect: '21 / 9',
      layout: 'zone',
      owned: true,
      flavor: 'Legit',
      tier: 'Tier II',
      condition: 42,
      conveyor: true,
      slots: [
        {
          id: 's1',
          slotType: 'mw_print',
          name: 'Druck',
          installed: 'mw_manual_press',
          zone: { x: 0.1, y: 0.5, w: 0.16, h: 0.6 }
        },
        {
          id: 's2',
          slotType: 'mw_drying',
          name: 'Trocknung',
          installed: null,
          zone: { x: 0.32, y: 0.5, w: 0.14, h: 0.6 }
        },
        {
          id: 's3',
          slotType: 'mw_storage',
          name: 'Lager',
          installed: 'mw_storage_racks',
          zone: { x: 0.6, y: 0.5, w: 0.14, h: 0.6 }
        },
        {
          id: 's4',
          slotType: 'mw_sales',
          name: 'Verkauf',
          installed: 'mw_bandcamp_bot',
          zone: { x: 0.88, y: 0.5, w: 0.16, h: 0.7 }
        }
      ]
    }
  }

  const SECTION_ORDER = [
    'tourbus_chassis',
    'studio_chassis',
    'bandhaus_chassis',
    'merch_workshop_chassis'
  ]

  function findModule(id) {
    for (const k in POOLS) {
      const hit = POOLS[k].find(m => m.id === id)
      if (hit) return hit
    }
    return null
  }
  function fmtEuro(n) {
    const sign = n < 0 ? '-' : ''
    return sign + '€' + Math.abs(n).toLocaleString('de-DE')
  }

  window.NTX = {
    genImageUrl,
    modulePrompt,
    STATUS,
    LIABILITIES,
    POOLS,
    SECTIONS,
    SECTION_ORDER,
    findModule,
    fmtEuro
  }
})()
