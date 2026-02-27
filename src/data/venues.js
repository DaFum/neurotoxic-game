export const ALL_VENUES = [
  // SACHSEN-ANHALT (Home)
  {
    id: 'stendal_proberaum',
    name: 'venues:stendal_proberaum.name',
    x: 50,
    y: 40,
    type: 'HOME',
    capacity: 0
  },
  {
    id: 'stendal_stadtfest',
    name: 'venues:stendal_stadtfest.name',
    x: 50,
    y: 39,
    type: 'VENUE',
    capacity: 300,
    pay: 500,
    diff: 2,
    price: 0
  },
  {
    id: 'stendal_adler',
    name: 'venues:stendal_adler.name',
    x: 50,
    y: 41,
    type: 'VENUE',
    capacity: 120,
    pay: 300,
    diff: 3,
    price: 8
  },
  {
    id: 'tangermuende_kaminstube',
    name: 'venues:tangermuende_kaminstube.name',
    x: 52,
    y: 38,
    type: 'VENUE',
    capacity: 100,
    pay: 400,
    diff: 3,
    price: 10
  },
  {
    id: 'tangermuende_burgfest',
    name: 'venues:tangermuende_burgfest.name',
    x: 52,
    y: 37,
    type: 'VENUE',
    capacity: 450,
    pay: 1000,
    diff: 4,
    price: 15
  },
  {
    id: 'magdeburg_moritzhof',
    name: 'venues:magdeburg_moritzhof.name',
    x: 48,
    y: 45,
    type: 'VENUE',
    capacity: 250,
    pay: 650,
    diff: 3,
    price: 12
  },
  {
    id: 'magdeburg_factory',
    name: 'venues:magdeburg_factory.name',
    x: 48,
    y: 46,
    type: 'VENUE',
    capacity: 600,
    pay: 1250,
    diff: 4,
    price: 18
  },
  {
    id: 'magdeburg_stadtpark',
    name: 'venues:magdeburg_stadtpark.name',
    x: 48,
    y: 44,
    type: 'FESTIVAL',
    capacity: 1200,
    pay: 2500,
    diff: 5,
    price: 25
  },

  // SACHSEN
  {
    id: 'leipzig_conne',
    name: 'venues:leipzig_conne.name',
    x: 55,
    y: 55,
    type: 'VENUE',
    capacity: 400,
    pay: 1000,
    diff: 4,
    price: 15
  },
  {
    id: 'leipzig_ut',
    name: 'venues:leipzig_ut.name',
    x: 55,
    y: 56,
    type: 'VENUE',
    capacity: 180,
    pay: 550,
    diff: 3,
    price: 12
  },
  {
    id: 'leipzig_distille',
    name: 'venues:leipzig_distille.name',
    x: 55,
    y: 54,
    type: 'VENUE',
    capacity: 90,
    pay: 300,
    diff: 2,
    price: 5
  },
  {
    id: 'leipzig_taeubchen',
    name: 'venues:leipzig_taeubchen.name',
    x: 56,
    y: 55,
    type: 'VENUE',
    capacity: 600,
    pay: 1600,
    diff: 4,
    price: 20
  },
  {
    id: 'leipzig_werk2',
    name: 'venues:leipzig_werk2.name',
    x: 55,
    y: 57,
    type: 'VENUE',
    capacity: 850,
    pay: 2000,
    diff: 4,
    price: 22
  },
  {
    id: 'leipzig_agra',
    name: 'venues:leipzig_agra.name',
    x: 55,
    y: 58,
    type: 'FESTIVAL',
    capacity: 2500,
    pay: 6500,
    diff: 5,
    price: 35
  },
  {
    id: 'leipzig_arena',
    name: 'venues:leipzig_arena.name',
    x: 54,
    y: 55,
    type: 'FESTIVAL',
    capacity: 6500,
    pay: 16000,
    diff: 5,
    price: 50
  },
  {
    id: 'dresden_beatpol',
    name: 'venues:dresden_beatpol.name',
    x: 65,
    y: 58,
    type: 'VENUE',
    capacity: 350,
    pay: 800,
    diff: 3,
    price: 15
  },
  {
    id: 'dresden_chemie',
    name: 'venues:dresden_chemie.name',
    x: 65,
    y: 57,
    type: 'VENUE',
    capacity: 800,
    pay: 1800,
    diff: 4,
    price: 20
  },

  // NIEDERSACHSEN
  {
    id: 'hannover_chez',
    name: 'venues:hannover_chez.name',
    x: 35,
    y: 35,
    type: 'VENUE',
    capacity: 220,
    pay: 600,
    diff: 3,
    price: 10
  },
  {
    id: 'hannover_musikzentrum',
    name: 'venues:hannover_musikzentrum.name',
    x: 35,
    y: 36,
    type: 'FESTIVAL',
    capacity: 1500,
    pay: 4000,
    diff: 5,
    price: 28
  },

  // OTHERS (Inferred to reach ~47)
  {
    id: 'berlin_so36',
    name: 'venues:berlin_so36.name',
    x: 60,
    y: 35,
    type: 'VENUE',
    capacity: 500,
    pay: 1200,
    diff: 4,
    price: 18
  },
  {
    id: 'berlin_cassiopeia',
    name: 'venues:berlin_cassiopeia.name',
    x: 61,
    y: 36,
    type: 'VENUE',
    capacity: 300,
    pay: 700,
    diff: 3,
    price: 12
  },
  {
    id: 'berlin_lido',
    name: 'venues:berlin_lido.name',
    x: 60,
    y: 37,
    type: 'VENUE',
    capacity: 600,
    pay: 1500,
    diff: 4,
    price: 20
  },
  {
    id: 'berlin_astra',
    name: 'venues:berlin_astra.name',
    x: 62,
    y: 36,
    type: 'FESTIVAL',
    capacity: 1500,
    pay: 3500,
    diff: 5,
    price: 25
  },
  {
    id: 'berlin_k17',
    name: 'venues:berlin_k17.name',
    x: 61,
    y: 34,
    type: 'VENUE',
    capacity: 400,
    pay: 900,
    diff: 3,
    price: 15
  },
  {
    id: 'hamburg_knust',
    name: 'venues:hamburg_knust.name',
    x: 35,
    y: 20,
    type: 'VENUE',
    capacity: 400,
    pay: 1000,
    diff: 3,
    price: 18
  },
  {
    id: 'hamburg_headcrash',
    name: 'venues:hamburg_headcrash.name',
    x: 35,
    y: 21,
    type: 'VENUE',
    capacity: 300,
    pay: 800,
    diff: 3,
    price: 15
  },
  {
    id: 'hamburg_markthalle',
    name: 'venues:hamburg_markthalle.name',
    x: 34,
    y: 20,
    type: 'FESTIVAL',
    capacity: 1000,
    pay: 2500,
    diff: 4,
    price: 25
  },
  {
    id: 'hamburg_logo',
    name: 'venues:hamburg_logo.name',
    x: 34,
    y: 21,
    type: 'VENUE',
    capacity: 200,
    pay: 500,
    diff: 3,
    price: 12
  },
  {
    id: 'koeln_underground',
    name: 'venues:koeln_underground.name',
    x: 15,
    y: 55,
    type: 'VENUE',
    capacity: 300,
    pay: 750,
    diff: 3,
    price: 15
  },
  {
    id: 'koeln_mtc',
    name: 'venues:koeln_mtc.name',
    x: 15,
    y: 56,
    type: 'VENUE',
    capacity: 150,
    pay: 400,
    diff: 2,
    price: 10
  },
  {
    id: 'koeln_luxor',
    name: 'venues:koeln_luxor.name',
    x: 15,
    y: 57,
    type: 'VENUE',
    capacity: 400,
    pay: 1000,
    diff: 3,
    price: 18
  },
  {
    id: 'muenchen_backstage',
    name: 'venues:muenchen_backstage.name',
    x: 50,
    y: 85,
    type: 'FESTIVAL',
    capacity: 1000,
    pay: 3000,
    diff: 5,
    price: 25
  },
  {
    id: 'muenchen_feierwerk',
    name: 'venues:muenchen_feierwerk.name',
    x: 50,
    y: 86,
    type: 'VENUE',
    capacity: 400,
    pay: 1000,
    diff: 3,
    price: 18
  },
  {
    id: 'stuttgart_lka',
    name: 'venues:stuttgart_lka.name',
    x: 30,
    y: 75,
    type: 'FESTIVAL',
    capacity: 1500,
    pay: 4000,
    diff: 5,
    price: 28
  },
  {
    id: 'dortmund_fzw',
    name: 'venues:dortmund_fzw.name',
    x: 20,
    y: 45,
    type: 'VENUE',
    capacity: 800,
    pay: 2000,
    diff: 4,
    price: 22
  },
  {
    id: 'dortmund_junkyard',
    name: 'venues:dortmund_junkyard.name',
    x: 20,
    y: 46,
    type: 'VENUE',
    capacity: 400,
    pay: 900,
    diff: 3,
    price: 15
  },
  {
    id: 'bremen_tower',
    name: 'venues:bremen_tower.name',
    x: 30,
    y: 25,
    type: 'VENUE',
    capacity: 300,
    pay: 700,
    diff: 3,
    price: 12
  },
  {
    id: 'frankfurt_batschkapp',
    name: 'venues:frankfurt_batschkapp.name',
    x: 30,
    y: 60,
    type: 'FESTIVAL',
    capacity: 1500,
    pay: 3500,
    diff: 5,
    price: 25
  },
  {
    id: 'kassel_goldgrube',
    name: 'venues:kassel_goldgrube.name',
    x: 35,
    y: 50,
    type: 'VENUE',
    capacity: 200,
    pay: 500,
    diff: 2,
    price: 10
  },
  {
    id: 'nuernberg_hirsch',
    name: 'venues:nuernberg_hirsch.name',
    x: 45,
    y: 70,
    type: 'VENUE',
    capacity: 800,
    pay: 1800,
    diff: 4,
    price: 20
  },
  {
    id: 'rostock_mau',
    name: 'venues:rostock_mau.name',
    x: 55,
    y: 15,
    type: 'VENUE',
    capacity: 600,
    pay: 1400,
    diff: 3,
    price: 18
  },
  {
    id: 'erfurt_centrum',
    name: 'venues:erfurt_centrum.name',
    x: 45,
    y: 55,
    type: 'VENUE',
    capacity: 500,
    pay: 1100,
    diff: 3,
    price: 15
  },
  {
    id: 'saarbruecken_garage',
    name: 'venues:saarbruecken_garage.name',
    x: 10,
    y: 70,
    type: 'FESTIVAL',
    capacity: 1000,
    pay: 2500,
    diff: 4,
    price: 22
  },
  {
    id: 'freiburg_jazzhaus',
    name: 'venues:freiburg_jazzhaus.name',
    x: 20,
    y: 85,
    type: 'VENUE',
    capacity: 300,
    pay: 800,
    diff: 3,
    price: 15
  },
  {
    id: 'kiel_pumpe',
    name: 'venues:kiel_pumpe.name',
    x: 38,
    y: 10,
    type: 'VENUE',
    capacity: 400,
    pay: 900,
    diff: 3,
    price: 15
  }
]
