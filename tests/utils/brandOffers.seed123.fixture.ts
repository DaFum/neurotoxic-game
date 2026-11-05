// Captured from real generateBrandOffers + buildBrandOffer at be36616ad.
// Seed: mulberry32(123); contexts match brandDealLogic.test.ts.
// Keep fixed: updating this fixture requires reviewing post-gig RNG/terms changes.
export const seededPostGigOffers = [
  {
    instagram: 1000,
    offers: [
      {
        id: 'indie_label_void',
        name: 'Void Records',
        description: 'A small indie label interested in your "unique" sound.',
        type: 'RECORD_DEAL',
        alignment: 'INDIE',
        requirements: {
          followers: 1000,
          trend: ['DRAMA', 'WHOLESOME'],
          trait: 'melodic_genius',
          trendSet: new Set(['DRAMA', 'WHOLESOME'])
        },
        offer: {
          upfront: 1550,
          revenueShare: 0.1,
          duration: 22
        },
        benefit: {
          fameMultiplier: 1.2
        },
        flavor: {
          campaignCodename: 'Lo-Fi Press',
          rep: {
            nameKey: 'economy:brandFlavor.reps.INDIE.2.name',
            nameDefault: 'Oli',
            titleKey: 'economy:brandFlavor.reps.INDIE.2.title',
            titleDefault: 'tape label owner'
          },
          taglineKey: 'economy:brandFlavor.taglines.INDIE.1',
          taglineDefault: 'No suits. No filler.',
          hookKey: 'economy:brandFlavor.hooks.newcomer',
          hookDefault:
            'A scout caught a clip. Small offer, but it’s a foot in the door.',
          variant: 'desperate',
          variantLabelKey: 'economy:brandFlavor.variant.desperate',
          variantLabelDefault: 'Last-Minute Pitch',
          urgency: 'high',
          isStretched: true
        }
      },
      {
        id: 'indie_clothing',
        name: 'Thrift Threads',
        description:
          'Local thrift shop wants you to model their weirdest finds.',
        type: 'SPONSORSHIP',
        alignment: 'INDIE',
        requirements: {
          followers: 1200,
          trend: ['DRAMA', 'MUSIC'],
          trendSet: new Set(['DRAMA', 'MUSIC'])
        },
        offer: {
          upfront: 100,
          duration: 2,
          perGig: 25
        },
        benefit: {
          loyalty: 1
        },
        flavor: {
          campaignCodename: 'Void Collective',
          rep: {
            nameKey: 'economy:brandFlavor.reps.INDIE.1.name',
            nameDefault: 'jess r.',
            titleKey: 'economy:brandFlavor.reps.INDIE.1.title',
            titleDefault: 'A&R, kinda'
          },
          taglineKey: 'economy:brandFlavor.taglines.INDIE.2',
          taglineDefault: 'Built in the basement.',
          hookKey: 'economy:brandFlavor.hooks.newcomer',
          hookDefault:
            'A scout caught a clip. Small offer, but it’s a foot in the door.',
          variant: 'desperate',
          variantLabelKey: 'economy:brandFlavor.variant.desperate',
          variantLabelDefault: 'Last-Minute Pitch',
          urgency: 'high',
          isStretched: true
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
          duration: 2,
          perGig: 25
        },
        penalty: {
          controversy: 1,
          loyalty: -2
        },
        flavor: {
          campaignCodename: 'Standard Goods',
          rep: {
            nameKey: 'economy:brandFlavor.reps.NEUTRAL.1.name',
            nameDefault: 'Sam Otieno',
            titleKey: 'economy:brandFlavor.reps.NEUTRAL.1.title',
            titleDefault: 'Partnership Lead'
          },
          taglineKey: 'economy:brandFlavor.taglines.NEUTRAL.2',
          taglineDefault: 'Tested. Trusted. Touring.',
          hookKey: 'economy:brandFlavor.hooks.trend_match',
          hookDefault:
            'The algorithm flagged you. They want in before everyone else does.',
          variant: 'standard',
          variantLabelKey: 'economy:brandFlavor.variant.standard',
          variantLabelDefault: 'Standard Deal',
          urgency: 'medium',
          isStretched: false
        }
      }
    ]
  },
  {
    instagram: 500000,
    offers: [
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
          upfront: 850,
          revenueShare: 0.05,
          duration: 10
        },
        benefit: {
          fameMultiplier: 1.1
        },
        flavor: {
          campaignCodename: 'Void Collective',
          rep: {
            nameKey: 'economy:brandFlavor.reps.INDIE.1.name',
            nameDefault: 'jess r.',
            titleKey: 'economy:brandFlavor.reps.INDIE.1.title',
            titleDefault: 'A&R, kinda'
          },
          taglineKey: 'economy:brandFlavor.taglines.INDIE.3',
          taglineDefault: 'For the cassette generation.',
          hookKey: 'economy:brandFlavor.hooks.famous',
          hookDefault: 'Your name opens doors now. They came knocking.',
          variant: 'standard',
          variantLabelKey: 'economy:brandFlavor.variant.standard',
          variantLabelDefault: 'Standard Deal',
          urgency: 'low',
          isStretched: false
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
          duration: 9
        },
        benefit: {
          fameMultiplier: 1.3,
          loyalty: 5
        },
        flavor: {
          campaignCodename: 'Raw Collective',
          rep: {
            nameKey: 'economy:brandFlavor.reps.INDIE.0.name',
            nameDefault: 'kai',
            titleKey: 'economy:brandFlavor.reps.INDIE.0.title',
            titleDefault: 'runs the zine'
          },
          taglineKey: 'economy:brandFlavor.taglines.INDIE.1',
          taglineDefault: 'No suits. No filler.',
          hookKey: 'economy:brandFlavor.hooks.famous',
          hookDefault: 'Your name opens doors now. They came knocking.',
          variant: 'standard',
          variantLabelKey: 'economy:brandFlavor.variant.standard',
          variantLabelDefault: 'Standard Deal',
          urgency: 'low',
          isStretched: false
        }
      },
      {
        id: 'youth_music_program',
        name: 'Street Chords Initiative',
        description:
          'A program teaching kids in the slums how to play punk rock.',
        type: 'SPONSORSHIP',
        alignment: 'GOOD',
        requirements: {
          followers: 8000,
          maxControversy: 50
        },
        offer: {
          upfront: 100,
          duration: 8,
          perGig: 55
        },
        benefit: {
          loyalty: 4
        },
        penalty: {
          controversy: -2
        },
        flavor: {
          campaignCodename: 'Valiant Souls Apparel',
          rep: {
            nameKey: 'economy:brandFlavor.reps.GOOD.1.name',
            nameDefault: 'Dr. Idris Bello',
            titleKey: 'economy:brandFlavor.reps.GOOD.1.title',
            titleDefault: 'Foundation Director'
          },
          taglineKey: 'economy:brandFlavor.taglines.GOOD.1',
          taglineDefault: 'Amplify hope.',
          hookKey: 'economy:brandFlavor.hooks.famous',
          hookDefault: 'Your name opens doors now. They came knocking.',
          variant: 'standard',
          variantLabelKey: 'economy:brandFlavor.variant.standard',
          variantLabelDefault: 'Standard Deal',
          urgency: 'low',
          isStretched: false
        }
      }
    ]
  }
]
