// Financial Events
export const FINANCIAL_EVENTS = [
  {
    id: 'unexpected_bill',
    category: 'financial',
    title: 'UNEXPECTED BILL',
    description: 'The rehearsal room rent was increased retroactively.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Pay it [-50€]',
        effect: { type: 'resource', resource: 'money', value: -50 },
        outcomeText: 'Ouch.'
      }
    ]
  },
  {
    id: 'gear_theft',
    category: 'financial',
    title: 'GEAR THEFT',
    description: 'Someone broke into the van and stole a pedalboard!',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Buy replacement [-300€]',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'resource',
              resource: 'money',
              value: -300,
              description: 'Emergency expense.'
            },
            { type: 'stat', stat: 'mood', value: -10 }
          ]
        },
        outcomeText: 'You found a used one on Kleinanzeigen.'
      },
      {
        label: 'Play without it [-10 Harmony]',
        effect: {
          type: 'stat',
          stat: 'harmony',
          value: -10,
          description: 'Sound is thin.'
        },
        outcomeText: 'The gig sounded terrible.'
      }
    ]
  },
  {
    id: 'parking_fine',
    category: 'financial',
    title: 'PARKING TICKET',
    description: 'You parked in a no-stopping zone to unload.',
    trigger: 'random',
    chance: 0.06,
    options: [
      {
        label: 'Pay fine [-35€]',
        effect: {
          type: 'resource',
          resource: 'money',
          value: -35,
          description: 'Standard fine.'
        },
        outcomeText: 'Better than being towed.'
      }
    ]
  },
  {
    id: 'tax_audit',
    category: 'financial',
    title: 'FINANZAMT LETTER',
    description: 'A grey envelope arrives. Something about "Umsatzsteuer".',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Call Tax Advisor [-150€]',
        effect: {
          type: 'resource',
          resource: 'money',
          value: -150,
          description: 'Consultation fee.'
        },
        outcomeText: 'He sorted it out. Expensive but safe.'
      },
      {
        label: 'Ignore it [Risk]',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: {
            type: 'stat',
            stat: 'mood',
            value: 5,
            description: 'It was a mistake!'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -500,
            description: 'Late fees and penalties.'
          }
        },
        outcomeText: 'You threw it in the trash.'
      }
    ]
  },
  {
    id: 'broken_merch_box',
    category: 'financial',
    title: 'MERCH BOX COLLAPSE',
    description: 'Your merch box fell apart during load-in.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Replace stock [-100€]',
        effect: { type: 'resource', resource: 'money', value: -100 },
        outcomeText: 'New shirts printed.'
      },
      {
        label: 'Sell damaged ones cheap [+50€]',
        effect: { type: 'resource', resource: 'money', value: 50 },
        outcomeText: '“Vintage condition.”'
      }
    ]
  },
  {
    id: 'sponsor_offer',
    category: 'financial',
    title: 'WEIRD SPONSOR OFFER',
    description: 'A local energy drink wants to sponsor one show.',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Accept [+300€, -5 Credibility]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: 300 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'You played next to a neon fridge.'
      },
      {
        label: 'Decline [+5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'Integrity intact.'
      }
    ]
  },
  {
    id: 'fuel_price_spike',
    category: 'financial',
    title: 'FUEL PRICE SPIKE',
    description: 'The next station is absurdly expensive.',
    trigger: 'random',
    chance: 0.06,
    options: [
      {
        label: 'Pay it [-40€]',
        effect: { type: 'resource', resource: 'money', value: -40 },
        outcomeText: 'Your wallet makes a noise.'
      },
      {
        label: 'Search for cheaper [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'resource', resource: 'money', value: -20 },
          failure: { type: 'resource', resource: 'money', value: -60 }
        },
        outcomeText: 'You gamble with detours.'
      }
    ]
  },
  {
    id: 'broken_cable_bulk',
    category: 'financial',
    title: 'CABLE DISASTER',
    description: 'Half your cables crackle. It’s like the van is cursed.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Buy a bundle [-60€]',
        effect: { type: 'resource', resource: 'money', value: -60 },
        outcomeText: 'Fresh cables. Fresh hope.'
      },
      {
        label: 'Keep using them [-5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'Every show becomes a coin flip.'
      }
    ]
  },
  {
    id: 'venue_short_pay',
    category: 'financial',
    title: 'SHORT PAY',
    description: 'The promoter claims “low turnout” and offers less money.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Accept it [-10 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -10 },
        outcomeText: 'You swallow your pride.'
      },
      {
        label: 'Argue [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'resource', resource: 'money', value: 80 },
              { type: 'stat', stat: 'harmony', value: 3 }
            ]
          },
          failure: { type: 'stat', stat: 'harmony', value: -8 }
        },
        outcomeText: 'You try to negotiate.'
      }
    ]
  },
  {
    id: 'merch_restock_opportunity',
    category: 'financial',
    title: 'CHEAP MERCH RESTOCK',
    description: 'A friend offers a cheap print run—today only.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Restock [-120€]',
        effect: { type: 'resource', resource: 'money', value: -120 },
        outcomeText: 'New shirts smell like fresh ink.'
      },
      {
        label: 'Skip it',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'You hope you won’t regret it.'
      }
    ]
  },
  {
    id: 'merch_big_sale',
    category: 'financial',
    title: 'MERCH BLOWOUT',
    description: 'A surprise crowd actually buys stuff.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Count the cash [+180€]',
        effect: { type: 'resource', resource: 'money', value: 180 },
        outcomeText: 'This is why you carried boxes.'
      }
    ]
  },
  {
    id: 'towed_van',
    category: 'financial',
    title: 'TOWED VAN',
    description: 'You come back and the van is gone. Amazing.',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Pay impound [-220€]',
        effect: { type: 'resource', resource: 'money', value: -220 },
        outcomeText: 'You consider quitting music.'
      },
      {
        label: 'Try to charm the clerk [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: { type: 'resource', resource: 'money', value: -120 },
          failure: { type: 'resource', resource: 'money', value: -260 }
        },
        outcomeText: 'You smile through pain.'
      }
    ]
  },
  {
    id: 'broken_drum_head',
    category: 'financial',
    title: 'BROKEN DRUM HEAD',
    description: 'Marius cracked a drum head. Again.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Replace it [-35€]',
        effect: { type: 'resource', resource: 'money', value: -35 },
        outcomeText: 'Fresh head, fresh attack.'
      },
      {
        label: 'Tape it up [Skill]',
        skillCheck: {
          stat: 'skill',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 2 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'DIY engineering.'
      }
    ]
  },
  {
    id: 'random_refund',
    category: 'financial',
    title: 'RANDOM REFUND',
    description: 'A forgotten deposit comes back to you.',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Nice. [+70€]',
        effect: { type: 'resource', resource: 'money', value: 70 },
        outcomeText: 'Free money feels illegal.'
      }
    ]
  },
  {
    id: 'atm_fee_trap',
    category: 'financial',
    title: 'ATM FEE TRAP',
    description: 'You withdraw cash and get hit with ridiculous fees.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Pay the fee [-10€]',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'Tour life tax.'
      },
      {
        label: 'Cancel and search another ATM [-0.5h]',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'You walk around like a lost NPC.'
      }
    ]
  },
  {
    id: 'damaged_merch_print',
    category: 'financial',
    title: 'DAMAGED PRINT',
    description: 'Some shirts have a misprint. It’s… kinda cool?',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Sell as “limited error edition” [+60€]',
        effect: { type: 'resource', resource: 'money', value: 60 },
        outcomeText: 'Collectors love nonsense.'
      },
      {
        label: 'Trash them [-20€]',
        effect: { type: 'resource', resource: 'money', value: -20 },
        outcomeText: 'Painful but clean.'
      }
    ]
  },
  {
    id: 'hospitality_win',
    category: 'financial',
    title: 'HOSPITALITY WIN',
    description: 'The venue actually feeds you. Like, real food.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Eat like kings [+10 Mood]',
        effect: { type: 'stat', stat: 'mood', value: 10 },
        outcomeText: 'Vegetables. Is this allowed?'
      }
    ]
  },
  {
    id: 'van_cleaning_fee',
    category: 'financial',
    title: 'CLEANING FEE',
    description: 'You return a room key and get charged for “excessive mess”.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Pay [-40€]',
        effect: { type: 'resource', resource: 'money', value: -40 },
        outcomeText: 'You disagree, but ok.'
      },
      {
        label: 'Argue [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'resource', resource: 'money', value: 0 },
          failure: { type: 'resource', resource: 'money', value: -60 }
        },
        outcomeText: 'You try to talk your way out.'
      }
    ]
  },
  {
    id: 'broken_phone_screen',
    category: 'financial',
    title: 'BROKEN PHONE SCREEN',
    description: 'Your phone slips during load-out. Crunch.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Repair [-90€]',
        effect: { type: 'resource', resource: 'money', value: -90 },
        outcomeText: 'At least maps work again.'
      },
      {
        label: 'Live with it [-5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'Every swipe is a gamble.'
      }
    ]
  },
  {
    id: 'unexpected_donation',
    category: 'financial',
    title: 'UNEXPECTED DONATION',
    description: 'A fan insists on giving you cash “for gas”.',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Accept [+50€]',
        effect: { type: 'resource', resource: 'money', value: 50 },
        outcomeText: 'You feel weirdly grateful.'
      },
      {
        label: 'Refuse [+3 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: 3 },
        outcomeText: 'Pride today, hunger tomorrow.'
      }
    ]
  },
  {
    id: 'rehearsal_room_discount',
    category: 'financial',
    title: 'REHEARSAL ROOM DISCOUNT',
    description: 'Your rehearsal space owner offers a discount if you play a private show.',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'Agree [+100€]',
        effect: { type: 'resource', resource: 'money', value: 100 },
        outcomeText: 'Weird gig, easy money.'
      },
      {
        label: 'Decline',
        effect: { type: 'stat', stat: 'mood', value: 0 },
        outcomeText: 'You keep it simple.'
      }
    ]
  },
  {
    id: 'insurance_forms',
    category: 'financial',
    title: 'INSURANCE FORMS',
    description: 'Paperwork arrives. Nobody understands it.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Spend time on it [-1h, +5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'time', value: -1 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'Adulting hurts.'
      },
      {
        label: 'Ignore it [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 2 },
          failure: { type: 'resource', resource: 'money', value: -120 }
        },
        outcomeText: 'You pretend it doesn’t exist.'
      }
    ]
  }
]
