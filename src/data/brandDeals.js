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
      trait: 'party_animal' // Marius helps
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
      trait: 'virtuoso' // Matze helps
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
  }
]
