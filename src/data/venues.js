export const ALL_VENUES = [
  // SACHSEN-ANHALT (Home)
  { id: 'stendal_proberaum', name: 'Proberaum', x: 50, y: 40, type: 'HOME', capacity: 0 },
  { id: 'stendal_stadtfest', name: 'Stadtfest Stendal', x: 50, y: 39, type: 'VENUE', capacity: 300, pay: 500, diff: 2, price: 0 },
  { id: 'stendal_adler', name: 'Schwarzer Adler', x: 50, y: 41, type: 'VENUE', capacity: 120, pay: 300, diff: 3, price: 8 },
  { id: 'tangermuende_kaminstube', name: 'Kaminstube', x: 52, y: 38, type: 'VENUE', capacity: 100, pay: 400, diff: 3, price: 10 },
  { id: 'tangermuende_burgfest', name: 'Burgfest', x: 52, y: 37, type: 'VENUE', capacity: 450, pay: 1000, diff: 4, price: 15 },
  { id: 'magdeburg_moritzhof', name: 'Moritzhof', x: 48, y: 45, type: 'VENUE', capacity: 250, pay: 650, diff: 3, price: 12 },
  { id: 'magdeburg_factory', name: 'Factory', x: 48, y: 46, type: 'VENUE', capacity: 600, pay: 1250, diff: 4, price: 18 },
  { id: 'magdeburg_stadtpark', name: 'Stadtpark OA', x: 48, y: 44, type: 'VENUE', capacity: 1200, pay: 2500, diff: 5, price: 25 },

  // SACHSEN
  { id: 'leipzig_conne', name: 'Conne Island', x: 55, y: 55, type: 'VENUE', capacity: 400, pay: 1000, diff: 4, price: 15 },
  { id: 'leipzig_ut', name: 'UT Connewitz', x: 55, y: 56, type: 'VENUE', capacity: 180, pay: 550, diff: 3, price: 12 },
  { id: 'leipzig_distille', name: 'Die Distille', x: 55, y: 54, type: 'VENUE', capacity: 90, pay: 300, diff: 2, price: 5 },
  { id: 'leipzig_taeubchen', name: 'Täubchenthal', x: 56, y: 55, type: 'VENUE', capacity: 600, pay: 1600, diff: 4, price: 20 },
  { id: 'leipzig_werk2', name: 'Werk 2', x: 55, y: 57, type: 'VENUE', capacity: 850, pay: 2000, diff: 4, price: 22 },
  { id: 'leipzig_agra', name: 'Agra Halle', x: 55, y: 58, type: 'VENUE', capacity: 2500, pay: 6500, diff: 5, price: 35 },
  { id: 'leipzig_arena', name: 'QB Arena', x: 54, y: 55, type: 'VENUE', capacity: 6500, pay: 16000, diff: 5, price: 50 },
  { id: 'dresden_beatpol', name: 'Beatpol', x: 65, y: 58, type: 'VENUE', capacity: 350, pay: 800, diff: 3, price: 15 },
  { id: 'dresden_chemie', name: 'Chemiefabrik', x: 65, y: 57, type: 'VENUE', capacity: 800, pay: 1800, diff: 4, price: 20 },

  // NIEDERSACHSEN
  { id: 'hannover_chez', name: 'Bei Chez Heinz', x: 35, y: 35, type: 'VENUE', capacity: 220, pay: 600, diff: 3, price: 10 },
  { id: 'hannover_musikzentrum', name: 'Musikzentrum', x: 35, y: 36, type: 'VENUE', capacity: 1500, pay: 4000, diff: 5, price: 28 },

  // OTHERS (Inferred to reach ~47)
  { id: 'berlin_so36', name: 'SO36', x: 60, y: 35, type: 'VENUE', capacity: 500, pay: 1200, diff: 4, price: 18 },
  { id: 'berlin_cassiopeia', name: 'Cassiopeia', x: 61, y: 36, type: 'VENUE', capacity: 300, pay: 700, diff: 3, price: 12 },
  { id: 'berlin_lido', name: 'Lido', x: 60, y: 37, type: 'VENUE', capacity: 600, pay: 1500, diff: 4, price: 20 },
  { id: 'berlin_astra', name: 'Astra', x: 62, y: 36, type: 'VENUE', capacity: 1500, pay: 3500, diff: 5, price: 25 },
  { id: 'berlin_k17', name: 'K17', x: 61, y: 34, type: 'VENUE', capacity: 400, pay: 900, diff: 3, price: 15 },
  { id: 'hamburg_knust', name: 'Knust', x: 35, y: 20, type: 'VENUE', capacity: 400, pay: 1000, diff: 3, price: 18 },
  { id: 'hamburg_headcrash', name: 'Headcrash', x: 35, y: 21, type: 'VENUE', capacity: 300, pay: 800, diff: 3, price: 15 },
  { id: 'hamburg_markthalle', name: 'Markthalle', x: 34, y: 20, type: 'VENUE', capacity: 1000, pay: 2500, diff: 4, price: 25 },
  { id: 'hamburg_logo', name: 'Logo', x: 34, y: 21, type: 'VENUE', capacity: 200, pay: 500, diff: 3, price: 12 },
  { id: 'koeln_underground', name: 'Underground', x: 15, y: 55, type: 'VENUE', capacity: 300, pay: 750, diff: 3, price: 15 },
  { id: 'koeln_mtc', name: 'MTC', x: 15, y: 56, type: 'VENUE', capacity: 150, pay: 400, diff: 2, price: 10 },
  { id: 'koeln_luxor', name: 'Luxor', x: 15, y: 57, type: 'VENUE', capacity: 400, pay: 1000, diff: 3, price: 18 },
  { id: 'muenchen_backstage', name: 'Backstage', x: 50, y: 85, type: 'VENUE', capacity: 1000, pay: 3000, diff: 5, price: 25 },
  { id: 'muenchen_feierwerk', name: 'Feierwerk', x: 50, y: 86, type: 'VENUE', capacity: 400, pay: 1000, diff: 3, price: 18 },
  { id: 'stuttgart_lka', name: 'LKA Longhorn', x: 30, y: 75, type: 'VENUE', capacity: 1500, pay: 4000, diff: 5, price: 28 },
  { id: 'dortmund_fzw', name: 'FZW', x: 20, y: 45, type: 'VENUE', capacity: 800, pay: 2000, diff: 4, price: 22 },
  { id: 'dortmund_junkyard', name: 'Junkyard', x: 20, y: 46, type: 'VENUE', capacity: 400, pay: 900, diff: 3, price: 15 },
  { id: 'bremen_tower', name: 'Tower', x: 30, y: 25, type: 'VENUE', capacity: 300, pay: 700, diff: 3, price: 12 },
  { id: 'frankfurt_batschkapp', name: 'Batschkapp', x: 30, y: 60, type: 'VENUE', capacity: 1500, pay: 3500, diff: 5, price: 25 },
  { id: 'kassel_goldgrube', name: 'Goldgrube', x: 35, y: 50, type: 'VENUE', capacity: 200, pay: 500, diff: 2, price: 10 },
  { id: 'nuernberg_hirsch', name: 'Hirsch', x: 45, y: 70, type: 'VENUE', capacity: 800, pay: 1800, diff: 4, price: 20 },
  { id: 'rostock_mau', name: 'MAU Club', x: 55, y: 15, type: 'VENUE', capacity: 600, pay: 1400, diff: 3, price: 18 },
  { id: 'erfurt_centrum', name: 'Centrum', x: 45, y: 55, type: 'VENUE', capacity: 500, pay: 1100, diff: 3, price: 15 },
  { id: 'saarbruecken_garage', name: 'Garage', x: 10, y: 70, type: 'VENUE', capacity: 1000, pay: 2500, diff: 4, price: 22 },
  { id: 'freiburg_jazzhaus', name: 'Jazzhaus', x: 20, y: 85, type: 'VENUE', capacity: 300, pay: 800, diff: 3, price: 15 },
  { id: 'kiel_pumpe', name: 'Die Pumpe', x: 38, y: 10, type: 'VENUE', capacity: 400, pay: 900, diff: 3, price: 15 }
]
