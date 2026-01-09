// Financial Events
export const FINANCIAL_EVENTS = [
  {
    id: 'unexpected_bill',
    category: 'financial',
    title: 'UNEXPECTED BILL',
    text: 'The rehearsal room rent was increased retroactively.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Pay it [-50€]',
        effect: { type: 'resource', resource: 'money', value: -50 },
        outcomeText: 'Ouch.'
      }
    ]
  }
]
