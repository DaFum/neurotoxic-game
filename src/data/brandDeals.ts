// TODO: Review this file
// Brand Deal Templates and Logic
// This file defines the potential brand partnerships a band can attract.

export const BRAND_DEALS = [
  {
    id: 'energy_drink_cx',
    name: 'Toxic Energy Drink',
    description:
      'The green stuff that glows. They want you to drink it on stage.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 2000,
      trend: ['TECH', 'NEUTRAL'],
      trait: 'party_animal',
      maxZealotry: 20
    },
    offer: {
      upfront: 500,
      perGig: 50,
      duration: 5
    },
    penalty: {
      controversy: 5,
      loyalty: -10
    }
  },
  {
    id: 'gutter_brew',
    name: 'Toxic Gutter Brew',
    description:
      'The cheapest, most toxic beer in town. They want you to drink it on stage.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 1500,
      trait: 'party_animal'
    },
    offer: {
      upfront: 250,
      perGig: 45,
      duration: 5
    },
    penalty: {
      controversy: 3,
      loyalty: -5
    }
  },
  {
    id: 'corp_fast_food',
    name: 'BurgerCorp Value Menu',
    description: 'Promote our new artificial meat slurry burgers.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 2500,
      maxControversy: 40
    },
    offer: {
      upfront: 400,
      perGig: 40,
      duration: 4
    },
    penalty: {
      controversy: -1,
      loyalty: -8
    }
  },
  {
    id: 'corp_app',
    name: 'Streamify Social',
    description: 'A soulless corporate streaming app trying to look hip.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 2800,
      trend: ['MUSIC', 'TECH']
    },
    offer: {
      upfront: 600,
      perGig: 35,
      duration: 5
    },
    penalty: {
      controversy: 0,
      loyalty: -6
    }
  },
  {
    id: 'indie_label_void',
    name: 'Void Records',
    description: 'A small indie label interested in your "unique" sound.',
    type: 'RECORD_DEAL',
    alignment: 'INDIE',
    requirements: {
      followers: 1000,
      trend: ['DRAMA', 'WHOLESOME'],
      trait: 'melodic_genius'
    },
    offer: {
      upfront: 2000,
      revenueShare: 0.1,
      duration: 20
    },
    benefit: {
      fameMultiplier: 1.2
    }
  },
  {
    id: 'indie_clothing',
    name: 'Thrift Threads',
    description: 'Local thrift shop wants you to model their weirdest finds.',
    type: 'SPONSORSHIP',
    alignment: 'INDIE',
    requirements: {
      followers: 1200,
      trend: ['GRUNGE', 'PUNK']
    },
    offer: {
      upfront: 100,
      perGig: 25,
      duration: 3
    },
    benefit: {
      loyalty: 1
    }
  },
  {
    id: 'vegan_snacks',
    name: 'No-Kill Grill Snacks',
    description: 'Cruelty-free jerky for the road.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 1500,
      trend: ['WHOLESOME'],
      trait: 'social_manager'
    },
    offer: {
      upfront: 300,
      perGig: 20,
      duration: 3
    },
    benefit: {
      staminaRegen: 2
    }
  },
  {
    id: 'recycled_picks',
    name: 'Eco-Strum Picks',
    description: 'Guitar picks made from recycled ocean plastic.',
    type: 'ENDORSEMENT',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 1800,
      trait: 'virtuoso'
    },
    offer: {
      upfront: 150,
      perGig: 30,
      duration: 4
    },
    penalty: {
      controversy: -1,
      loyalty: -2
    }
  },
  {
    id: 'basement_zine',
    name: 'Static Noise Zine',
    description: 'An underground punk zine looking for grassroots support.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 1000,
      minControversy: 20
    },
    offer: {
      upfront: 0,
      perGig: 15,
      duration: 3
    },
    penalty: {
      controversy: 4,
      loyalty: 1
    }
  },
  {
    id: 'community_radio',
    name: 'Pirate Signal 88.9',
    description: 'Local community radio needs a shoutout to stay on air.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 2000,
      trend: ['MUSIC', 'PUNK']
    },
    offer: {
      upfront: 50,
      perGig: 20,
      duration: 4
    },
    benefit: {
      loyalty: 3,
      fameMultiplier: 1.05
    }
  },
  {
    id: 'local_pawn_shop',
    name: 'Rusty Strings Pawn Shop',
    description:
      'A local pawn shop that wants you to promote their rusty gear.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 500,
      maxControversy: 50
    },
    offer: {
      upfront: 100,
      perGig: 25,
      duration: 3
    },
    penalty: {
      controversy: 1,
      loyalty: -2
    }
  },
  {
    id: 'neon_lung_vapes',
    name: 'Neon Lung Vaporizers',
    description: 'Cheap, flavored vapes for the masses.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 800,
      maxControversy: 60
    },
    offer: {
      upfront: 150,
      perGig: 35,
      duration: 4
    },
    penalty: {
      controversy: 2,
      loyalty: -1
    }
  },
  {
    id: 'synapse_nootropics',
    name: 'Synapse+ Brain Supplements',
    description: 'Unregulated grey-market brain supplements.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 6000,
      trend: ['TECH', 'NEUTRAL']
    },
    offer: {
      upfront: 600,
      perGig: 85,
      duration: 6
    },
    penalty: {
      controversy: 6,
      loyalty: -4
    }
  },
  {
    id: 'cult_pamphlets',
    name: 'Children of the New Dawn',
    description:
      'A cult looking to spread their message through your obsessed fans.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 7500,
      minZealotry: 30
    },
    offer: {
      upfront: 200,
      perGig: 150,
      duration: 5
    },
    penalty: {
      controversy: 10,
      loyalty: -6
    }
  },
  {
    id: 'underground_fight_club',
    name: 'Blood & Rust Brawlhouse',
    description: 'Promote an illegal underground fighting ring.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 8500,
      minControversy: 40
    },
    offer: {
      upfront: 800,
      perGig: 110,
      duration: 4
    },
    penalty: {
      controversy: 12,
      loyalty: -8
    }
  },
  {
    id: 'guitar_brand_shred',
    name: 'ShredMaster Guitars',
    description: 'An endorsement deal for up-and-coming shredders.',
    type: 'ENDORSEMENT',
    alignment: 'CORPORATE',
    requirements: {
      followers: 5000,
      trend: ['MUSIC', 'TECH'],
      trait: 'virtuoso',
      maxZealotry: 20
    },
    offer: {
      upfront: 1000,
      item: 'golden_pick',
      duration: 10
    },
    penalty: {
      loyalty: -5
    }
  },
  {
    id: 'corp_beverage',
    name: 'AquaPure Corporate Water',
    description: 'Overpriced bottled water from a monolithic conglomerate.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 6000,
      maxControversy: 35
    },
    offer: {
      upfront: 1200,
      perGig: 90,
      duration: 8
    },
    penalty: {
      controversy: -2,
      loyalty: -10
    }
  },
  {
    id: 'corp_tech',
    name: 'NovaTech Headsets',
    description: 'Corporate audio gear that breaks after a month.',
    type: 'ENDORSEMENT',
    alignment: 'CORPORATE',
    requirements: {
      followers: 7500,
      trend: ['TECH']
    },
    offer: {
      upfront: 1500,
      perGig: 100,
      duration: 6
    },
    penalty: {
      controversy: 0,
      loyalty: -7
    }
  },
  {
    id: 'indie_festival',
    name: 'Dust & Echoes Festival',
    description: 'Be the face of a gritty mid-tier indie music festival.',
    type: 'SPONSORSHIP',
    alignment: 'INDIE',
    requirements: {
      followers: 5500,
      trend: ['MUSIC', 'GRUNGE']
    },
    offer: {
      upfront: 500,
      perGig: 75,
      duration: 5
    },
    benefit: {
      fameMultiplier: 1.15,
      loyalty: 2
    }
  },
  {
    id: 'indie_amp_builder',
    name: 'VoltCraft Custom Amps',
    description:
      'A boutique amp builder wants you to test their loud, unstable creations.',
    type: 'ENDORSEMENT',
    alignment: 'INDIE',
    requirements: {
      followers: 6500,
      trait: 'melodic_genius'
    },
    offer: {
      upfront: 400,
      perGig: 85,
      duration: 4
    },
    penalty: {
      controversy: 2,
      loyalty: 1
    }
  },
  {
    id: 'indie_vinyl_press',
    name: 'GrooveGrave Vinyls',
    description:
      'An independent vinyl pressing plant looking for exclusive artists.',
    type: 'RECORD_DEAL',
    alignment: 'INDIE',
    requirements: {
      followers: 8000,
      minZealotry: 15
    },
    offer: {
      upfront: 800,
      revenueShare: 0.05,
      duration: 8
    },
    benefit: {
      fameMultiplier: 1.1
    }
  },
  {
    id: 'solar_power_bank',
    name: 'Helios Portable Power',
    description: 'Promote solar-powered battery banks for touring bands.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 5000,
      trend: ['TECH', 'WHOLESOME']
    },
    offer: {
      upfront: 600,
      perGig: 65,
      duration: 5
    },
    penalty: {
      controversy: -3,
      loyalty: 0
    }
  },
  {
    id: 'upcycled_instruments',
    name: 'Reclaim Guitars',
    description: 'Guitars made entirely from old skateboards and junk.',
    type: 'ENDORSEMENT',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 7000,
      trait: 'virtuoso'
    },
    offer: {
      upfront: 500,
      perGig: 80,
      duration: 6
    },
    benefit: {
      loyalty: 2
    }
  },
  {
    id: 'hemp_merch',
    name: 'WeedWeave Apparel',
    description: 'Sustainable, organic hemp band merch provider.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 8500,
      minControversy: 10
    },
    offer: {
      upfront: 700,
      perGig: 75,
      duration: 4
    },
    penalty: {
      controversy: 2,
      loyalty: 1
    }
  },
  {
    id: 'riot_apparel',
    name: 'Black Flag Riot Apparel',
    description: 'Edgy clothing brand for the rebellious youth.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 5000,
      minControversy: 40
    },
    offer: {
      upfront: 0,
      perGig: 60,
      duration: 4
    },
    penalty: {
      controversy: 8,
      loyalty: 2
    }
  },
  {
    id: 'charity_concerts',
    name: 'Rock Against The Machine',
    description: 'An NGO booking bands for political awareness concerts.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 6500,
      minZealotry: 20
    },
    offer: {
      upfront: 200,
      perGig: 40,
      duration: 5
    },
    benefit: {
      fameMultiplier: 1.2,
      loyalty: 5
    }
  },
  {
    id: 'youth_music_program',
    name: 'Street Chords Initiative',
    description: 'A program teaching kids in the slums how to play punk rock.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 8000,
      maxControversy: 50
    },
    offer: {
      upfront: 100,
      perGig: 50,
      duration: 6
    },
    benefit: {
      loyalty: 4
    },
    penalty: {
      controversy: -2
    }
  },
  {
    id: 'blood_bank_promo',
    name: 'Sanguis Clinic Blood Bank',
    description: 'A slightly morbid promotion for the local blood bank.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 4000,
      maxZealotry: 40
    },
    offer: {
      upfront: 400,
      perGig: 70,
      duration: 6
    },
    penalty: {
      controversy: 5,
      loyalty: -3
    }
  },
  {
    id: 'boutique_synth',
    name: 'Neuro-Tech Instruments',
    description: 'High-end synthesizers for the tech-savvy musician.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 8000,
      trend: ['TECH', 'SYNTH']
    },
    offer: {
      upfront: 800,
      perGig: 100,
      duration: 5
    },
    penalty: {
      controversy: 0,
      loyalty: -2
    }
  },
  {
    id: 'dark_web_vpn',
    name: 'ShadowRoute VPN',
    description: 'A shady VPN service for the paranoid internet user.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 9000,
      trend: ['TECH', 'PUNK']
    },
    offer: {
      upfront: 500,
      perGig: 90,
      duration: 4
    },
    penalty: {
      controversy: 1,
      loyalty: -1
    }
  },
  {
    id: 'crypto_scam',
    name: 'NeuroCoin NFT Casino',
    description: 'A blatant crypto scam wrapped in a flashy casino.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 15000
    },
    offer: {
      upfront: 2500,
      perGig: 300,
      duration: 4
    },
    penalty: {
      controversy: 15,
      loyalty: -20
    }
  },
  {
    id: 'mega_corp_records',
    name: 'OmniCorp Media Group',
    description: 'The ultimate corporate sellout deal. They own you now.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 25000,
      maxControversy: 30
    },
    offer: {
      upfront: 5000,
      perGig: 500,
      duration: 10
    },
    penalty: {
      controversy: -5,
      loyalty: -15
    }
  },
  {
    id: 'pmc_recruitment',
    name: 'Aegis Security Solutions (PMC)',
    description: 'A private military company recruiting aggressive fans.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 20000,
      minControversy: 40
    },
    offer: {
      upfront: 4000,
      perGig: 400,
      duration: 8
    },
    penalty: {
      controversy: -8,
      loyalty: -18
    }
  },
  {
    id: 'designer_narcotics',
    name: 'Neuro-Bliss Pharmaceuticals',
    description: 'High-end designer drugs for the party elite.',
    type: 'SPONSORSHIP',
    alignment: 'EVIL',
    requirements: {
      followers: 30000,
      trait: 'party_animal'
    },
    offer: {
      upfront: 6000,
      perGig: 600,
      duration: 5
    },
    penalty: {
      controversy: 20,
      loyalty: -12
    }
  },
  {
    id: 'corp_fashion_line',
    name: 'TrendSetter Mega-Brand',
    description: 'Plaster your logo on mass-produced fast fashion.',
    type: 'ENDORSEMENT',
    alignment: 'CORPORATE',
    requirements: {
      followers: 18000,
      maxControversy: 40
    },
    offer: {
      upfront: 3500,
      perGig: 350,
      duration: 7
    },
    penalty: {
      controversy: -4,
      loyalty: -12
    }
  },
  {
    id: 'corp_automobile',
    name: 'AeroDrive Motorworks',
    description:
      'A massive car manufacturer wants a "rock" aesthetic for their commercials.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 22000,
      maxControversy: 20
    },
    offer: {
      upfront: 4500,
      perGig: 450,
      duration: 9
    },
    penalty: {
      controversy: -10,
      loyalty: -14
    }
  },
  {
    id: 'corp_energy_conglomerate',
    name: 'Global Power Dynamics',
    description: 'Greenwashing a massive oil company through your music.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 28000,
      minZealotry: 10
    },
    offer: {
      upfront: 5500,
      perGig: 550,
      duration: 11
    },
    penalty: {
      controversy: 10,
      loyalty: -18
    }
  },
  {
    id: 'corp_tech_giant',
    name: 'Synapse Core Computing',
    description: 'The biggest tech monopoly wants to make you their mascot.',
    type: 'SPONSORSHIP',
    alignment: 'CORPORATE',
    requirements: {
      followers: 32000,
      trend: ['TECH']
    },
    offer: {
      upfront: 7000,
      perGig: 650,
      duration: 12
    },
    penalty: {
      controversy: -5,
      loyalty: -16
    }
  },
  {
    id: 'indie_cult_label',
    name: 'Mothman Cult Records',
    description: 'The most prestigious underground label in the scene.',
    type: 'RECORD_DEAL',
    alignment: 'INDIE',
    requirements: {
      followers: 16000,
      minZealotry: 40
    },
    offer: {
      upfront: 2000,
      revenueShare: 0.15,
      duration: 10
    },
    benefit: {
      fameMultiplier: 1.3,
      loyalty: 5
    }
  },
  {
    id: 'indie_film_soundtrack',
    name: 'A25 Cinema',
    description:
      'An acclaimed indie film studio wants you to score their next gritty thriller.',
    type: 'SPONSORSHIP',
    alignment: 'INDIE',
    requirements: {
      followers: 21000,
      trend: ['DRAMA']
    },
    offer: {
      upfront: 3000,
      perGig: 250,
      duration: 6
    },
    benefit: {
      fameMultiplier: 1.25,
      loyalty: 3
    }
  },
  {
    id: 'indie_art_collective',
    name: 'The Concrete Canvas',
    description: 'An elite underground art collective sponsors your visuals.',
    type: 'SPONSORSHIP',
    alignment: 'INDIE',
    requirements: {
      followers: 26000,
      minControversy: 50
    },
    offer: {
      upfront: 1500,
      perGig: 300,
      duration: 8
    },
    penalty: {
      controversy: 15
    },
    benefit: {
      loyalty: 8
    }
  },
  {
    id: 'indie_world_tour',
    name: 'Guerilla Booking Agency',
    description: 'A legendary independent booking agency takes you global.',
    type: 'SPONSORSHIP',
    alignment: 'INDIE',
    requirements: {
      followers: 31000,
      trait: 'social_manager'
    },
    offer: {
      upfront: 4000,
      perGig: 400,
      duration: 15
    },
    benefit: {
      fameMultiplier: 1.4,
      loyalty: 4
    }
  },
  {
    id: 'sustainable_energy_provider',
    name: 'WindShear Renewables',
    description:
      'A massive sustainable energy provider wants to power your tour.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 17000,
      maxControversy: 35
    },
    offer: {
      upfront: 3000,
      perGig: 300,
      duration: 8
    },
    penalty: {
      controversy: -5,
      loyalty: -2
    }
  },
  {
    id: 'sustainable_farming_coop',
    name: 'Gaia Hydroponics',
    description: 'A global network of sustainable vertical farms.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 23000,
      trend: ['WHOLESOME']
    },
    offer: {
      upfront: 2500,
      perGig: 350,
      duration: 7
    },
    benefit: {
      staminaRegen: 5,
      loyalty: 2
    }
  },
  {
    id: 'sustainable_vehicle_corp',
    name: 'Volt Motors EV',
    description: "Promote the world's leading electric van manufacturer.",
    type: 'ENDORSEMENT',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 29000,
      maxZealotry: 20
    },
    offer: {
      upfront: 5000,
      perGig: 450,
      duration: 10
    },
    penalty: {
      controversy: -8,
      loyalty: -6
    }
  },
  {
    id: 'sustainable_global_ngo',
    name: 'Earth First Global',
    description:
      'The largest environmental NGO wants you as their global ambassador.',
    type: 'SPONSORSHIP',
    alignment: 'SUSTAINABLE',
    requirements: {
      followers: 34000,
      minControversy: 10,
      maxControversy: 40
    },
    offer: {
      upfront: 4000,
      perGig: 500,
      duration: 12
    },
    benefit: {
      fameMultiplier: 1.2,
      loyalty: 5
    }
  },
  {
    id: 'good_rebel_fund',
    name: 'The Resistance Warchest',
    description:
      'A mysterious fund supporting bands that speak truth to power.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 16000,
      minControversy: 60
    },
    offer: {
      upfront: 2000,
      perGig: 350,
      duration: 6
    },
    penalty: {
      controversy: 20
    },
    benefit: {
      loyalty: 10
    }
  },
  {
    id: 'good_human_rights',
    name: 'Amnesty International Coalition',
    description: 'A massive human rights organization partners with you.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 22000,
      maxControversy: 30
    },
    offer: {
      upfront: 3000,
      perGig: 400,
      duration: 8
    },
    penalty: {
      controversy: -10
    },
    benefit: {
      loyalty: 8
    }
  },
  {
    id: 'good_whistleblower_network',
    name: 'TruthLeak Foundation',
    description: 'Promote a dangerous network of corporate whistleblowers.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 27000,
      minZealotry: 50
    },
    offer: {
      upfront: 1500,
      perGig: 550,
      duration: 5
    },
    penalty: {
      controversy: 25
    },
    benefit: {
      loyalty: 15
    }
  },
  {
    id: 'good_utopian_city',
    name: 'New Eden Project',
    description: 'Be the voice of a radical new utopian city-state experiment.',
    type: 'SPONSORSHIP',
    alignment: 'GOOD',
    requirements: {
      followers: 33000,
      trend: ['WHOLESOME', 'TECH']
    },
    offer: {
      upfront: 5000,
      perGig: 600,
      duration: 10
    },
    benefit: {
      fameMultiplier: 1.5,
      loyalty: 12
    }
  },
  {
    id: 'mega_tour_promoter',
    name: 'LiveNation Global',
    description:
      'Massive global tour promoter with zero tolerance for liabilities.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 35000,
      maxControversy: 25
    },
    offer: {
      upfront: 2000,
      perGig: 700,
      duration: 12
    },
    penalty: {
      controversy: -2,
      loyalty: -5
    }
  },
  {
    id: 'neutral_telecom',
    name: 'OmniNet Communications',
    description:
      "The world's largest telecom network wants to sponsor your streams.",
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 19000,
      trend: ['TECH']
    },
    offer: {
      upfront: 3000,
      perGig: 350,
      duration: 8
    },
    penalty: {
      controversy: -1,
      loyalty: -4
    }
  },
  {
    id: 'neutral_instrument_conglomerate',
    name: 'Yamaha Global Instruments',
    description: 'A massive, boring, but reliable instrument manufacturer.',
    type: 'ENDORSEMENT',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 24000,
      trait: 'virtuoso'
    },
    offer: {
      upfront: 4000,
      perGig: 400,
      duration: 10
    },
    penalty: {
      controversy: -3,
      loyalty: -3
    }
  },
  {
    id: 'neutral_logistics',
    name: 'Atlas Shipping Solutions',
    description:
      'They ship your gear. They pay you to say they ship your gear.',
    type: 'SPONSORSHIP',
    alignment: 'NEUTRAL',
    requirements: {
      followers: 29000,
      maxZealotry: 30
    },
    offer: {
      upfront: 3500,
      perGig: 450,
      duration: 9
    },
    penalty: {
      controversy: 0,
      loyalty: -2
    }
  }
]

export const BRAND_DEALS_BY_ID = new Map(
  BRAND_DEALS.map(deal => [
    deal.id,
    {
      ...deal,
      requirements: {
        ...deal.requirements,
        trendSet:
          deal.requirements && Array.isArray(deal.requirements.trend)
            ? new Set(deal.requirements.trend)
            : undefined
      }
    }
  ])
)
