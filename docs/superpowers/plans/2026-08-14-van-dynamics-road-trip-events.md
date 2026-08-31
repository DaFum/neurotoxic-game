# Van Dynamics & Road Trip Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 6 rich narrative road-trip & rest-stop travel events in `src/data/events/` with German/English translations and automated unit/integration tests.

**Architecture:** Add declarative event definitions with skill checks and composite effect deltas to `band.ts` and `transport.ts`. Ensure 100% i18n key parity in `public/locales/de/events.json` and `public/locales/en/events.json`. Test with isolated event runner tests and full quality gates.

**Tech Stack:** TypeScript, React 19, Vitest, i18next.

---

## File Structure

- **Modified:**
  - `public/locales/de/events.json` — German localization keys for all 6 events.
  - `public/locales/en/events.json` — English localization keys for all 6 events.
  - `src/data/events/band.ts` — Adding `van_playlist_dispute`, `traffic_jam_improv`, `night_drive_heart_to_heart`.
  - `src/data/events/transport.ts` — Adding `reststop_night_coffee`, `van_ac_heater_failure`.
  - `src/data/events/special.ts` — Adding `reststop_trunk_dealer`.
- **Created:**
  - `tests/data/events/roadTripEvents.test.js` — Unit and integration tests for all 6 road-trip events.

---

## Tasks

### Task 1: Add German and English Localization Keys

**Files:**

- Modify: `public/locales/de/events.json`
- Modify: `public/locales/en/events.json`

- [ ] **Step 1: Add German localization keys to `public/locales/de/events.json`**

Keys to add:

```json
  "van_playlist_dispute": {
    "title": "Playlist-Diktatur auf der A7",
    "desc": "In den steilen Anstiegen der Kasseler Berge eskaliert der Streit um das Van-Radio: Matze will rohen Industrial, Marius drückt Hardcore-Techno rein und Lars fordert Ruhe.",
    "opt1": {
      "label": "Lars übernimmt die Moderation (Charisma-Check)",
      "outcome": "Lars vermittelt diplomatisch zwischen den Musik-Egos.",
      "successOutcome": "Lars zaubert ein obskures Synth-Punk-Tape aus dem Handschuhfach, das alle begeistert. Die Stimmung steigt enorm!",
      "failureOutcome": "Lars wird niedergebrüllt. Missmut und ohrenbetäubender Lärm erfüllen den Van."
    },
    "opt2": {
      "label": "Demokratische Funkstille & Podcast",
      "outcome": "Weder Industrial noch Techno: Stille und ein trockener Geschichts-Podcast senken die Reizüberflutung."
    },
    "opt3": {
      "label": "Marius dreht die Boxen auf Anschlag",
      "outcome": "Marius feiert eine Solo-Party am Beifahrersitz, während Matze mit zugehaltenen Ohren kocht."
    }
  },
  "reststop_night_coffee": {
    "title": "3-Uhr-Kaffee am Rasthof Brockenblick",
    "desc": "03:20 Uhr. Starkregen auf der A39. Die Augen brennen und der Van braucht eine dringende Pause auf einem verlassenen Autohof.",
    "opt1": {
      "label": "Großes Rasthof-Menü & Espresso (-45 €)",
      "outcome": "Heißer Espresso und Schnitzelbrötchen für die gesamte Band bringen Lebensgeister und Ausdauer zurück."
    },
    "opt2": {
      "label": "Dubioser Energy-Drink aus dem Kofferraum",
      "outcome": "Koffein-Schock für Marius! Seine Müdigkeit verfliegt, aber der Van-Kühlschrank hat Batterie und Benzin gezogen."
    },
    "opt3": {
      "label": "30-Minuten Powernap auf den Sitzen",
      "outcome": "Kurzer Schlaf auf zerschlissenen Polstern. Ungemütlich, aber die Band tankt Harmonie."
    }
  },
  "traffic_jam_improv": {
    "title": "Elbtunnel-Stau & Van-Akustik",
    "desc": "45 Minuten Stillstand vor Hamburg in flirrender Sommerhitze. Die Band droht vor Langeweile durchzudrehen.",
    "opt1": {
      "label": "Akustik-Jam & Songwriting (Improv-Check)",
      "outcome": "Die Instrumente werden zwischen den Sitzen hervorgekramt.",
      "successOutcome": "Aus einem albernen Klatschen entsteht eine mörderische Hookline! Die Band ist voller Euphorie.",
      "failureOutcome": "Verstimmte Saiten und Hektik: Matze kritisiert Lars' Rhythmusgefühl, Frust macht sich breit."
    },
    "opt2": {
      "label": "Social-Media-Rant streamen (Charisma-Check)",
      "outcome": "Lars startet einen Live-Stream aus dem kochenden Van.",
      "successOutcome": "Der authentische Ausbruch geht viral und zieht neue Hype-Follower an!",
      "failureOutcome": "Der Stream wirkt wehleidig und erntet hämische Kommentare im Netz."
    },
    "opt3": {
      "label": "Wartung im Leerlauf",
      "outcome": "Matze nutzt den Stillstand, kriecht unter die Haube und sichert lockere Schläuche."
    }
  },
  "reststop_trunk_dealer": {
    "title": "Kofferraum-Flohmarkt am Autohof",
    "desc": "Ein abgeranzter Kombi parkt neben dem Van. Ein zwielichtiger Reisender in Lederjacke öffnet seinen Kofferraum voller modifizierter Module und DIY-Elektronik.",
    "opt1": {
      "label": "Modifiziertes Effekt-Modul kaufen (-120 €)",
      "outcome": "Du zahlst den vollen Preis und erhältst ein seltenes Stück Underground-Gear für euer Stash."
    },
    "opt2": {
      "label": "Hart feilschen (Charisma-Check)",
      "outcome": "Du versuchst, den Händler mit Band-Charme im Preis zu drücken.",
      "successOutcome": "Geschicktes Verhandeln: Du sicherst dir das Modul zum halben Preis!",
      "failureOutcome": "Der Händler fühlt sich beleidigt, knallt den Kofferraum zu und zischt ab."
    },
    "opt3": {
      "label": "Dankend ablehnen und weiterfahren",
      "outcome": "Vorsicht ist besser als Nachsicht. Lars behält die Tour-Kasse im Auge."
    }
  },
  "van_ac_heater_failure": {
    "title": "Klimaanlagen-Kollaps auf der A9",
    "desc": "Das Lüftungsgebläse heult gequält auf und spuckt stinkenden Staub. Die Temperatur im Innenraum wird unerträglich.",
    "opt1": {
      "label": "Matzes DIY-Lötaktion (Technik-Check)",
      "outcome": "Matze greift zu Panzertape, Seitenschneider und Lötkolben.",
      "successOutcome": "Mit technischem Geschick überbrückt Matze das Relais. Frische Luft strömt wieder!",
      "failureOutcome": "Ein Funke, ein Knall – Kurzschluss! Das Gebläse ist tot und die Stimmung im Eimer."
    },
    "opt2": {
      "label": "Autohof-Werkstatt ansteuern (-110 €)",
      "outcome": "Ein Mechaniker wechselt das Gebläserad. Teuer, aber der Van läuft wieder zuverlässig."
    },
    "opt3": {
      "label": "Fenster runter und Zähne zusammenbeißen",
      "outcome": "Zugluft, Lärm und Abgase: Niemand ist glücklich, aber die Tourkasse bleibt unberührt."
    }
  },
  "night_drive_heart_to_heart": {
    "title": "Deep-Talk im Scheinwerferlicht",
    "desc": "02:00 Uhr auf einsamer Landstraße. Während die anderen schlafen, entsteht auf den Vordersitzen ein unerwartet ehrliches Gespräch über die Zukunft der Band.",
    "opt1": {
      "label": "Über alte Zeiten und Meilensteine reden",
      "outcome": "Gemeinsame Erinnerungen an die ersten schrottigen Gigs schweißen euch zusammen und bauen Stress ab."
    },
    "opt2": {
      "label": "Kritik an der Tour-Richtung äußern (Charisma-Check)",
      "outcome": "Ungeschminkte Wahrheit über Druck, Geld und kreative Differenzen.",
      "successOutcome": "Eine reinigende Aussprache! Gegenseitiges Verständnis und tiefer Respekt entstehen.",
      "failureOutcome": "Alte Wunden reißen auf: Vorwürfe und eisiges Schweigen belasten die Bandharmonie."
    },
    "opt3": {
      "label": "Einfach die Stille und die Nacht genießen",
      "outcome": "Begleitet vom Rauschen des Asphalts gleitet der Van ruhig durch die Dunkelheit."
    }
  }
```

- [ ] **Step 2: Add English localization keys to `public/locales/en/events.json`**

Keys to add matching 1:1 structure:

```json
  "van_playlist_dispute": {
    "title": "Playlist Dictatorship on the A7",
    "desc": "On the steep climbs of the Kasseler Berge, an argument erupts over the cassette deck: Matze demands raw industrial metal, Marius blasts hardcore techno, and Lars begs for peace.",
    "opt1": {
      "label": "Lars moderates the cabin (Charisma check)",
      "outcome": "Lars attempts diplomatic mediation between conflicting musical egos.",
      "successOutcome": "Lars pulls an obscure synth-punk tape from the glove box that everyone loves. Morale skyrockets!",
      "failureOutcome": "Lars gets shouted down. Bitterness and deafening noise fill the van."
    },
    "opt2": {
      "label": "Democratic silence & history podcast",
      "outcome": "Neither industrial nor techno: quiet and a dry history podcast reduce sensory overload."
    },
    "opt3": {
      "label": "Marius cranks the volume to eleven",
      "outcome": "Marius throws a solo party in the passenger seat while Matze fumes in silence."
    }
  },
  "reststop_night_coffee": {
    "title": "3 AM Coffee at Truck Stop Brockenblick",
    "desc": "03:20 AM in torrential rain on the A39. Eyes are burning and the van desperately needs a break at a desolate highway diner.",
    "opt1": {
      "label": "Full trucker meal & espresso (-45 €)",
      "outcome": "Hot espresso and schnitzel sandwiches for the whole band restore energy and stamina."
    },
    "opt2": {
      "label": "Shady energy drink from the trunk",
      "outcome": "Caffeine overdrive for Marius! His fatigue is gone, but the cooler drained battery and fuel."
    },
    "opt3": {
      "label": "30-minute power nap in the seats",
      "outcome": "A quick nap on worn-out seats. Uncomfortable, but the band recovers harmony."
    }
  },
  "traffic_jam_improv": {
    "title": "Elbtunnel Traffic Jam & Van Acoustics",
    "desc": "45 minutes of dead standstill before Hamburg in sweltering summer heat. The band is on the verge of cabin fever.",
    "opt1": {
      "label": "Acoustic jam & songwriting (Improv check)",
      "outcome": "Instruments are pulled out from under the seats.",
      "successOutcome": "A spontaneous clapping beat turns into a killer hookline! The band is euphoric.",
      "failureOutcome": "Out-of-tune strings and frustration: Matze critiques Lars' rhythm, souring the mood."
    },
    "opt2": {
      "label": "Stream a traffic rant (Charisma check)",
      "outcome": "Lars starts a live stream from the boiling van interior.",
      "successOutcome": "The raw, relatable rant goes viral and pulls in new followers!",
      "failureOutcome": "The stream comes across as whiny and gets mocked online."
    },
    "opt3": {
      "label": "Idle van maintenance",
      "outcome": "Matze uses the standstill to crawl under the hood and secure loose hoses."
    }
  },
  "reststop_trunk_dealer": {
    "title": "Trunk Flea Market at the Autohof",
    "desc": "A battered station wagon pulls up next to the van. A traveler in a patched leather jacket pops his trunk full of modded pedals and DIY electronics.",
    "opt1": {
      "label": "Buy modified effect module (-120 €)",
      "outcome": "You pay full price and gain a piece of rare underground gear for your stash."
    },
    "opt2": {
      "label": "Haggle hard (Charisma check)",
      "outcome": "You attempt to charm the dealer into a discount.",
      "successOutcome": "Smooth negotiation: You score the module at half price!",
      "failureOutcome": "The dealer feels insulted, slams the trunk shut, and drives away."
    },
    "opt3": {
      "label": "Politely decline and drive on",
      "outcome": "Better safe than sorry. Lars keeps tour finances guarded."
    }
  },
  "van_ac_heater_failure": {
    "title": "A/C Breakdown on the A9",
    "desc": "The blower motor screeches and spews foul-smelling dust. The cabin temperature quickly becomes unbearable.",
    "opt1": {
      "label": "Matze's DIY solder fix (Technical check)",
      "outcome": "Matze grabs gaffer tape, wire cutters, and a soldering iron.",
      "successOutcome": "With technical finesse, Matze bypasses the relay. Fresh air flows again!",
      "failureOutcome": "A spark, a pop — short circuit! The blower is dead and spirits plummet."
    },
    "opt2": {
      "label": "Stop at highway repair shop (-110 €)",
      "outcome": "A mechanic replaces the blower fan. Pricey, but the van runs reliably again."
    },
    "opt3": {
      "label": "Roll down the windows and power through",
      "outcome": "Drafts, deafening wind noise, and fumes: Nobody is happy, but the wallet stays safe."
    }
  },
  "night_drive_heart_to_heart": {
    "title": "Deep-Talk in the Headlights",
    "desc": "02:00 AM on a lonely country road. While the others sleep, an unexpectedly candid conversation starts on the front seats about the band's future.",
    "opt1": {
      "label": "Talk about early days and milestones",
      "outcome": "Shared memories of early chaotic gigs bond you together and relieve stress."
    },
    "opt2": {
      "label": "Voice constructive critique (Charisma check)",
      "outcome": "Honest truths about tour pressure, money, and creative differences.",
      "successOutcome": "A cathartic talk! Mutual understanding and deep respect are renewed.",
      "failureOutcome": "Old wounds reopen: Accusations and icy silence weigh heavily on band harmony."
    },
    "opt3": {
      "label": "Simply enjoy the quiet road in silence",
      "outcome": "Accompanied by the hum of the asphalt, the van glides smoothly through the dark."
    }
  }
```

- [ ] **Step 3: Run locale parity smoke test**

Command: `node --test tests/locale/smoke.test.js`
Expected: PASS with 0 key mismatches.

---

### Task 2: Implement Band Road-Trip Events in `src/data/events/band.ts`

**Files:**

- Modify: `src/data/events/band.ts`

- [ ] **Step 1: Add `van_playlist_dispute`, `traffic_jam_improv`, and `night_drive_heart_to_heart` definitions**

```typescript
  {
    id: 'van_playlist_dispute',
    category: 'band',
    tags: ['travel', 'personality', 'conflict'],
    title: 'events:van_playlist_dispute.title',
    description: 'events:van_playlist_dispute.desc',
    trigger: 'travel',
    chance: 0.09,
    options: [
      {
        label: 'events:van_playlist_dispute.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'harmony', value: 8 },
              {
                type: 'relationship',
                member1: 'Lars',
                member2: 'Matze',
                value: 10
              },
              {
                type: 'relationship',
                member1: 'Lars',
                member2: 'Marius',
                value: 10
              }
            ],
            description: 'events:van_playlist_dispute.opt1.successOutcome'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'mood', value: -5 },
              { type: 'stat', stat: 'harmony', value: -4 }
            ],
            description: 'events:van_playlist_dispute.opt1.failureOutcome'
          }
        },
        outcomeText: 'events:van_playlist_dispute.opt1.outcome'
      },
      {
        label: 'events:van_playlist_dispute.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: -2 },
            { type: 'stat', stat: 'stamina', value: 5 }
          ]
        },
        outcomeText: 'events:van_playlist_dispute.opt2.outcome'
      },
      {
        label: 'events:van_playlist_dispute.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 5 },
            {
              type: 'relationship',
              member1: 'Matze',
              member2: 'Marius',
              value: -10
            }
          ]
        },
        outcomeText: 'events:van_playlist_dispute.opt3.outcome'
      }
    ]
  },
  {
    id: 'traffic_jam_improv',
    category: 'band',
    tags: ['travel', 'jam', 'creativity'],
    title: 'events:traffic_jam_improv.title',
    description: 'events:traffic_jam_improv.desc',
    trigger: 'travel',
    chance: 0.07,
    options: [
      {
        label: 'events:traffic_jam_improv.opt1.label',
        skillCheck: {
          stat: 'improv',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'harmony', value: 12 },
              {
                type: 'relationship',
                member1: 'Lars',
                member2: 'Matze',
                value: 10
              },
              {
                type: 'relationship',
                member1: 'Matze',
                member2: 'Marius',
                value: 10
              }
            ],
            description: 'events:traffic_jam_improv.opt1.successOutcome'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'mood', value: -6 },
              { type: 'stat', stat: 'harmony', value: -4 }
            ],
            description: 'events:traffic_jam_improv.opt1.failureOutcome'
          }
        },
        outcomeText: 'events:traffic_jam_improv.opt1.outcome'
      },
      {
        label: 'events:traffic_jam_improv.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'fame', value: 25 },
              { type: 'stat', stat: 'viral', value: 5 }
            ],
            description: 'events:traffic_jam_improv.opt2.successOutcome'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'fame', value: -10 },
              { type: 'stat', stat: 'controversyLevel', value: 8 }
            ],
            description: 'events:traffic_jam_improv.opt2.failureOutcome'
          }
        },
        outcomeText: 'events:traffic_jam_improv.opt2.outcome'
      },
      {
        label: 'events:traffic_jam_improv.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'van_condition', value: 10 },
            { type: 'stat', stat: 'stamina', value: -8 }
          ]
        },
        outcomeText: 'events:traffic_jam_improv.opt3.outcome'
      }
    ]
  },
  {
    id: 'night_drive_heart_to_heart',
    category: 'band',
    tags: ['travel', 'bonding', 'night'],
    title: 'events:night_drive_heart_to_heart.title',
    description: 'events:night_drive_heart_to_heart.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:night_drive_heart_to_heart.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'relationship',
              member1: 'Lars',
              member2: 'Matze',
              value: 15
            },
            { type: 'stat', stat: 'harmony', value: 10 }
          ]
        },
        outcomeText: 'events:night_drive_heart_to_heart.opt1.outcome'
      },
      {
        label: 'events:night_drive_heart_to_heart.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              {
                type: 'relationship',
                member1: 'Lars',
                member2: 'Matze',
                value: 20
              },
              { type: 'stat', stat: 'mood', value: 10 }
            ],
            description: 'events:night_drive_heart_to_heart.opt2.successOutcome'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'relationship',
                member1: 'Lars',
                member2: 'Matze',
                value: -20
              },
              { type: 'stat', stat: 'harmony', value: -10 }
            ],
            description: 'events:night_drive_heart_to_heart.opt2.failureOutcome'
          }
        },
        outcomeText: 'events:night_drive_heart_to_heart.opt2.outcome'
      },
      {
        label: 'events:night_drive_heart_to_heart.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 5 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:night_drive_heart_to_heart.opt3.outcome'
      }
    ]
  }
```

---

### Task 3: Implement Transport & Rest-Stop Events in `src/data/events/transport.ts`

**Files:**

- Modify: `src/data/events/transport.ts`

- [ ] **Step 1: Add `reststop_night_coffee` and `van_ac_heater_failure` definitions**

```typescript
  {
    id: 'reststop_night_coffee',
    category: 'transport',
    tags: ['travel', 'reststop', 'stamina'],
    title: 'events:reststop_night_coffee.title',
    description: 'events:reststop_night_coffee.desc',
    trigger: 'travel',
    chance: 0.08,
    options: [
      {
        label: 'events:reststop_night_coffee.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -45 },
            { type: 'stat', stat: 'stamina', value: 15 }
          ]
        },
        outcomeText: 'events:reststop_night_coffee.opt1.outcome'
      },
      {
        label: 'events:reststop_night_coffee.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: 20 },
            { type: 'resource', resource: 'fuel', value: -5 }
          ]
        },
        outcomeText: 'events:reststop_night_coffee.opt2.outcome'
      },
      {
        label: 'events:reststop_night_coffee.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 10 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:reststop_night_coffee.opt3.outcome'
      }
    ]
  },
  {
    id: 'van_ac_heater_failure',
    category: 'transport',
    tags: ['travel', 'van', 'breakdown'],
    title: 'events:van_ac_heater_failure.title',
    description: 'events:van_ac_heater_failure.desc',
    trigger: 'travel',
    chance: 0.07,
    options: [
      {
        label: 'events:van_ac_heater_failure.opt1.label',
        skillCheck: {
          stat: 'technical',
          threshold: 10,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'mood', value: 15 },
              { type: 'stat', stat: 'van_condition', value: 5 }
            ],
            description: 'events:van_ac_heater_failure.opt1.successOutcome'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'van_condition', value: -10 },
              { type: 'stat', stat: 'harmony', value: -8 }
            ],
            description: 'events:van_ac_heater_failure.opt1.failureOutcome'
          }
        },
        outcomeText: 'events:van_ac_heater_failure.opt1.outcome'
      },
      {
        label: 'events:van_ac_heater_failure.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -110 },
            { type: 'stat', stat: 'van_condition', value: 15 }
          ]
        },
        outcomeText: 'events:van_ac_heater_failure.opt2.outcome'
      },
      {
        label: 'events:van_ac_heater_failure.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: -10 },
            { type: 'stat', stat: 'stamina', value: -5 }
          ]
        },
        outcomeText: 'events:van_ac_heater_failure.opt3.outcome'
      }
    ]
  }
```

---

### Task 4: Implement Special Trunk Dealer Event in `src/data/events/transport.ts`

**Files:**

- Modify: `src/data/events/transport.ts`

- [ ] **Step 1: Add `reststop_trunk_dealer` event definition**

```typescript
  {
    id: 'reststop_trunk_dealer',
    category: 'transport',
    tags: ['travel', 'merchant', 'gear', 'reststop'],
    title: 'events:reststop_trunk_dealer.title',
    description: 'events:reststop_trunk_dealer.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:reststop_trunk_dealer.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -120 },
            { type: 'item', item: 'c_diy_overdrive', value: 1 }
          ]
        },
        outcomeText: 'events:reststop_trunk_dealer.opt1.outcome'
      },
      {
        label: 'events:reststop_trunk_dealer.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 10,
          success: {
            type: 'composite',
            effects: [
              { type: 'resource', resource: 'money', value: -60 },
              { type: 'item', item: 'c_diy_overdrive', value: 1 }
            ],
            description: 'events:reststop_trunk_dealer.opt2.successOutcome'
          },
          failure: {
            type: 'stat',
            stat: 'mood',
            value: -2,
            description: 'events:reststop_trunk_dealer.opt2.failureOutcome'
          }
        },
        outcomeText: 'events:reststop_trunk_dealer.opt2.outcome'
      },
      {
        label: 'events:reststop_trunk_dealer.opt3.label',
        effect: {
          type: 'stat',
          stat: 'mood',
          value: 3
        },
        outcomeText: 'events:reststop_trunk_dealer.opt3.outcome'
      }
    ]
  }
```

---

### Task 5: Automated Unit Tests for Road-Trip Events

**Files:**

- Create: `tests/data/events/roadTripEvents.test.js`

- [ ] **Step 1: Write test suite verifying all 6 events**

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'

import { EVENTS_DB } from '../../../src/data/events/index'
import { resolveEventChoice } from '../../../src/utils/eventEngine/index'
import { applyEventDelta } from '../../../src/utils/gameState/delta'
import { createInitialState } from '../../../src/context/initialState'

const TARGET_EVENT_IDS = [
  'van_playlist_dispute',
  'reststop_night_coffee',
  'traffic_jam_improv',
  'reststop_trunk_dealer',
  'van_ac_heater_failure',
  'night_drive_heart_to_heart'
]

test('Road Trip Events Suite', async t => {
  await t.test('all 6 road-trip events are registered in EVENTS_DB', () => {
    for (const id of TARGET_EVENT_IDS) {
      const event = EVENTS_DB[id]
      assert.ok(event, `Expected event ${id} to be registered in EVENTS_DB`)
      assert.equal(
        event.trigger,
        'travel',
        `Expected event ${id} to have trigger 'travel'`
      )
      assert.ok(
        Array.isArray(event.options) && event.options.length === 3,
        `Expected event ${id} to have 3 options`
      )
    }
  })

  await t.test(
    'event options resolve and apply deltas cleanly without error',
    () => {
      const state = createInitialState()
      for (const id of TARGET_EVENT_IDS) {
        const event = EVENTS_DB[id]
        for (let i = 0; i < event.options.length; i++) {
          const option = event.options[i]
          const resolution = resolveEventChoice(option, state, () => 0.99)
          assert.ok(
            resolution,
            `Resolution should exist for ${id} opt ${i + 1}`
          )
          if (resolution.delta) {
            const nextState = applyEventDelta(state, resolution.delta)
            assert.ok(
              nextState,
              `applyEventDelta should succeed for ${id} opt ${i + 1}`
            )
          }
        }
      }
    }
  )
})
```

- [ ] **Step 2: Run the test suite**

Command: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/data/events/roadTripEvents.test.js`
Expected: PASS with all subtests passing.

---

### Task 6: Full Verification & Quality Gates

- [ ] **Step 1: Run locale smoke test**
      Command: `node --test tests/locale/smoke.test.js`
      Expected: PASS

- [ ] **Step 2: Run core type check**
      Command: `pnpm run typecheck:core`
      Expected: PASS (0 errors)

- [ ] **Step 3: Run fast test suite**
      Command: `pnpm run test`
      Expected: PASS (all 3,750+ tests passing)

- [ ] **Step 4: Commit changes**
      Command: `git add . && git commit -m "feat(events): add van dynamics and road trip events suite"`
