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
  }
]
