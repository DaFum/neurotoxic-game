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
      trait: 'party_animal', // Marius helps
      maxZealotry: 20
    },
    offer: {
      upfront: 500,
      perGig: 50,
      duration: 5 // gigs
    },
    penalty: {
      controversy: 5,
      loyalty: -10 // Evil brand hurts loyalty
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
      trait: 'virtuoso', // Matze helps
      maxZealotry: 20
    },
    offer: {
      upfront: 1000,
      item: 'golden_pick', // Special item
      duration: 10
    },
    penalty: {
      loyalty: -5 // "Sellout" risk if not handled well
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
      trait: 'melodic_genius' // Lars helps
    },
    offer: {
      upfront: 2000,
      revenueShare: 0.1, // They take 10% of gig money
      duration: 20
    },
    benefit: {
      fameMultiplier: 1.2
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
      perGig: 20, // Free food basically
      duration: 3
    },
    benefit: {
      staminaRegen: 2
    }
  },

  // ==========================================
  // TIER 1: EARLY GAME (Desperate for Cash)
  // ==========================================
  {
    id: 'local_pawn_shop',
    name: 'Rusty Strings Pawn Shop',
    description: 'A local pawn shop that wants you to promote their rusty gear.',
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
    id: 'gutter_brew',
    name: 'Toxic Gutter Brew',
    description: 'The cheapest, most toxic beer in town. They want you to drink it on stage.',
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

  // ==========================================
  // TIER 2: MID GAME (Finding a Niche)
  // ==========================================
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
    description: 'A cult looking to spread their message through your obsessed fans.',
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

  // ==========================================
  // TIER 3: LATE GAME (The Ultimate Sellout)
  // ==========================================
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
    id: 'mega_tour_promoter',
    name: 'LiveNation Global',
    description: 'Massive global tour promoter with zero tolerance for liabilities.',
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
