// Financial Events
export const FINANCIAL_EVENTS = [
  {
    id: 'unexpected_bill',
    category: 'financial',
    title: 'events:unexpected_bill.title',
    description: 'events:unexpected_bill.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:unexpected_bill.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -50 },
        outcomeText: 'events:unexpected_bill.opt1.outcome'
      }
    ]
  },
  {
    id: 'gear_theft',
    category: 'financial',
    title: 'events:gear_theft.title',
    description: 'events:gear_theft.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:gear_theft.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'resource',
              resource: 'money',
              value: -300,
              description: 'events:gear_theft.opt1.d_8026'
            },
            { type: 'stat', stat: 'mood', value: -10 }
          ]
        },
        outcomeText: 'events:gear_theft.opt1.outcome'
      },
      {
        label: 'events:gear_theft.opt2.label',
        effect: {
          type: 'stat',
          stat: 'harmony',
          value: -10,
          description: 'events:gear_theft.opt2.d_6b9d'
        },
        outcomeText: 'events:gear_theft.opt2.outcome'
      }
    ]
  },
  {
    id: 'parking_fine',
    category: 'financial',
    title: 'events:parking_fine.title',
    description: 'events:parking_fine.desc',
    trigger: 'random',
    chance: 0.06,
    options: [
      {
        label: 'events:parking_fine.opt1.label',
        effect: {
          type: 'resource',
          resource: 'money',
          value: -35,
          description: 'events:parking_fine.opt1.d_0a11'
        },
        outcomeText: 'events:parking_fine.opt1.outcome'
      }
    ]
  },
  {
    id: 'tax_audit',
    category: 'financial',
    title: 'events:tax_audit.title',
    description: 'events:tax_audit.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:tax_audit.opt1.label',
        effect: {
          type: 'resource',
          resource: 'money',
          value: -150,
          description: 'events:tax_audit.opt1.d_ca82'
        },
        outcomeText: 'events:tax_audit.opt1.outcome'
      },
      {
        label: 'events:tax_audit.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: {
            type: 'stat',
            stat: 'mood',
            value: 5,
            description: 'events:tax_audit.opt2.d_6384'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -500,
            description: 'events:tax_audit.opt2.d_c7a0'
          }
        },
        outcomeText: 'events:tax_audit.opt2.outcome'
      }
    ]
  },
  {
    id: 'broken_merch_box',
    category: 'financial',
    title: 'events:broken_merch_box.title',
    description: 'events:broken_merch_box.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:broken_merch_box.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -100 },
        outcomeText: 'events:broken_merch_box.opt1.outcome'
      },
      {
        label: 'events:broken_merch_box.opt2.label',
        effect: { type: 'resource', resource: 'money', value: 50 },
        outcomeText: 'events:broken_merch_box.opt2.outcome'
      }
    ]
  },
  {
    id: 'sponsor_offer',
    category: 'financial',
    title: 'events:sponsor_offer.title',
    description: 'events:sponsor_offer.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:sponsor_offer.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: 300 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'events:sponsor_offer.opt1.outcome'
      },
      {
        label: 'events:sponsor_offer.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'events:sponsor_offer.opt2.outcome'
      }
    ]
  },
  {
    id: 'fuel_price_spike',
    category: 'financial',
    title: 'events:fuel_price_spike.title',
    description: 'events:fuel_price_spike.desc',
    trigger: 'random',
    chance: 0.06,
    options: [
      {
        label: 'events:fuel_price_spike.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -40 },
        outcomeText: 'events:fuel_price_spike.opt1.outcome'
      },
      {
        label: 'events:fuel_price_spike.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'resource', resource: 'money', value: -20 },
          failure: { type: 'resource', resource: 'money', value: -60 }
        },
        outcomeText: 'events:fuel_price_spike.opt2.outcome'
      }
    ]
  },
  {
    id: 'broken_cable_bulk',
    category: 'financial',
    title: 'events:broken_cable_bulk.title',
    description: 'events:broken_cable_bulk.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:broken_cable_bulk.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -60 },
        outcomeText: 'events:broken_cable_bulk.opt1.outcome'
      },
      {
        label: 'events:broken_cable_bulk.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:broken_cable_bulk.opt2.outcome'
      }
    ]
  },
  {
    id: 'venue_short_pay',
    category: 'financial',
    title: 'events:venue_short_pay.title',
    description: 'events:venue_short_pay.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:venue_short_pay.opt1.label',
        effect: { type: 'stat', stat: 'mood', value: -10 },
        outcomeText: 'events:venue_short_pay.opt1.outcome'
      },
      {
        label: 'events:venue_short_pay.opt2.label',
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
        outcomeText: 'events:venue_short_pay.opt2.outcome'
      }
    ]
  },
  {
    id: 'merch_restock_opportunity',
    category: 'financial',
    title: 'events:merch_restock_opportunity.title',
    description: 'events:merch_restock_opportunity.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:merch_restock_opportunity.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -120 },
        outcomeText: 'events:merch_restock_opportunity.opt1.outcome'
      },
      {
        label: 'events:merch_restock_opportunity.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:merch_restock_opportunity.opt2.outcome'
      }
    ]
  },
  {
    id: 'merch_big_sale',
    category: 'financial',
    title: 'events:merch_big_sale.title',
    description: 'events:merch_big_sale.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:merch_big_sale.opt1.label',
        effect: { type: 'resource', resource: 'money', value: 180 },
        outcomeText: 'events:merch_big_sale.opt1.outcome'
      }
    ]
  },
  {
    id: 'towed_van',
    category: 'financial',
    title: 'events:towed_van.title',
    description: 'events:towed_van.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:towed_van.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -220 },
        outcomeText: 'events:towed_van.opt1.outcome'
      },
      {
        label: 'events:towed_van.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: { type: 'resource', resource: 'money', value: -120 },
          failure: { type: 'resource', resource: 'money', value: -260 }
        },
        outcomeText: 'events:towed_van.opt2.outcome'
      }
    ]
  },
  {
    id: 'broken_drum_head',
    category: 'financial',
    title: 'events:broken_drum_head.title',
    description: 'events:broken_drum_head.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:broken_drum_head.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -35 },
        outcomeText: 'events:broken_drum_head.opt1.outcome'
      },
      {
        label: 'events:broken_drum_head.opt2.label',
        skillCheck: {
          stat: 'skill',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 2 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'events:broken_drum_head.opt2.outcome'
      }
    ]
  },
  {
    id: 'random_refund',
    category: 'financial',
    title: 'events:random_refund.title',
    description: 'events:random_refund.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:random_refund.opt1.label',
        effect: { type: 'resource', resource: 'money', value: 70 },
        outcomeText: 'events:random_refund.opt1.outcome'
      }
    ]
  },
  {
    id: 'atm_fee_trap',
    category: 'financial',
    title: 'events:atm_fee_trap.title',
    description: 'events:atm_fee_trap.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:atm_fee_trap.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'events:atm_fee_trap.opt1.outcome'
      },
      {
        label: 'events:atm_fee_trap.opt2.label',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'events:atm_fee_trap.opt2.outcome'
      }
    ]
  },
  {
    id: 'damaged_merch_print',
    category: 'financial',
    title: 'events:damaged_merch_print.title',
    description: 'events:damaged_merch_print.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:damaged_merch_print.opt1.label',
        effect: { type: 'resource', resource: 'money', value: 60 },
        outcomeText: 'events:damaged_merch_print.opt1.outcome'
      },
      {
        label: 'events:damaged_merch_print.opt2.label',
        effect: { type: 'resource', resource: 'money', value: -20 },
        outcomeText: 'events:damaged_merch_print.opt2.outcome'
      }
    ]
  },
  {
    id: 'hospitality_win',
    category: 'financial',
    title: 'events:hospitality_win.title',
    description: 'events:hospitality_win.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:hospitality_win.opt1.label',
        effect: { type: 'stat', stat: 'mood', value: 10 },
        outcomeText: 'events:hospitality_win.opt1.outcome'
      }
    ]
  },
  {
    id: 'van_cleaning_fee',
    category: 'financial',
    title: 'events:van_cleaning_fee.title',
    description: 'events:van_cleaning_fee.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:van_cleaning_fee.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -40 },
        outcomeText: 'events:van_cleaning_fee.opt1.outcome'
      },
      {
        label: 'events:van_cleaning_fee.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'resource', resource: 'money', value: 0 },
          failure: { type: 'resource', resource: 'money', value: -60 }
        },
        outcomeText: 'events:van_cleaning_fee.opt2.outcome'
      }
    ]
  },
  {
    id: 'broken_phone_screen',
    category: 'financial',
    title: 'events:broken_phone_screen.title',
    description: 'events:broken_phone_screen.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:broken_phone_screen.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -90 },
        outcomeText: 'events:broken_phone_screen.opt1.outcome'
      },
      {
        label: 'events:broken_phone_screen.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:broken_phone_screen.opt2.outcome'
      }
    ]
  },
  {
    id: 'unexpected_donation',
    category: 'financial',
    title: 'events:unexpected_donation.title',
    description: 'events:unexpected_donation.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:unexpected_donation.opt1.label',
        effect: { type: 'resource', resource: 'money', value: 50 },
        outcomeText: 'events:unexpected_donation.opt1.outcome'
      },
      {
        label: 'events:unexpected_donation.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: 3 },
        outcomeText: 'events:unexpected_donation.opt2.outcome'
      }
    ]
  },
  {
    id: 'rehearsal_room_discount',
    category: 'financial',
    title: 'events:rehearsal_room_discount.title',
    description: 'events:rehearsal_room_discount.desc',
    trigger: 'random',
    chance: 0.02,
    options: [
      {
        label: 'events:rehearsal_room_discount.opt1.label',
        effect: { type: 'resource', resource: 'money', value: 100 },
        outcomeText: 'events:rehearsal_room_discount.opt1.outcome'
      },
      {
        label: 'events:rehearsal_room_discount.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 0 },
        outcomeText: 'events:rehearsal_room_discount.opt2.outcome'
      }
    ]
  },
  {
    id: 'insurance_forms',
    category: 'financial',
    title: 'events:insurance_forms.title',
    description: 'events:insurance_forms.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:insurance_forms.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'time', value: -1 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:insurance_forms.opt1.outcome'
      },
      {
        label: 'events:insurance_forms.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 2 },
          failure: { type: 'resource', resource: 'money', value: -120 }
        },
        outcomeText: 'events:insurance_forms.opt2.outcome'
      }
    ]
  }
]
