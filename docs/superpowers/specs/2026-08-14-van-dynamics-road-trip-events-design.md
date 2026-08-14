# Design Specification: Van Dynamics & Road Trip Events Suite

**Date:** 2026-08-14  
**Topic:** Van Dynamics & Rest Stop Dilemmas (`van-dynamics-road-trip-events`)  
**Status:** Approved by User  

---

## 1. Overview & Objective

The goal of this feature is to deepen band roleplay, character dynamics, and German tour atmosphere during travel on the overworld map. Six rich, interactive narrative events will be added to the travel event pool (`trigger: 'travel'`). Players will face authentic tour dilemmas on the Autobahn and at rest stops, testing band member stats (`charisma`, `technical`, `improv`, `stamina`) and shaping tour resources (money, fuel, van condition, band harmony, member mood, interpersonal relationships, and stress).

---

## 2. Event Catalog & Specifications

### 2.1 `van_playlist_dispute` ("Playlist-Diktatur auf der A7")
* **Category:** `band`
* **Trigger:** `travel`
* **Chance:** `0.09`
* **Narrative:** In the steep hills of the A7 highway (Kasseler Berge), an intense debate breaks out over the cassette deck. Matze demands relentless industrial metal, Marius cranks up aggressive hardcore techno, and Lars wants quiet or synth talk.
* **Option A: Lars moderates (Skill Check: `charisma` $\ge 7$)**
  * *Success:* Lars finds an obscure synth-punk tape everyone loves. (`+8` Band Harmony, `+10` Lars $\leftrightarrow$ Matze/Marius relationships, `-5` Stress).
  * *Failure:* Lars is overridden by the chaos; everyone gets annoyed. (`-5` Mood for all members, `-4` Harmony).
* **Option B: Democratic Compromise (Podcasts / Silence)**
  * *Outcome:* Low enthusiasm, but avoids conflict. (`-2` Mood Matze/Marius, `+5` Lars Stamina).
* **Option C: Crank Up the Volume (Marius party mode)**
  * *Outcome:* Marius gets hyped, Matze gets furious. (`+15` Marius Mood, `+10` Band Stress, `-8` Matze Mood).

---

### 2.2 `reststop_night_coffee` ("3-Uhr-Kaffee am Rasthof Brockenblick")
* **Category:** `transport`
* **Trigger:** `travel`
* **Chance:** `0.08`
* **Narrative:** 03:20 AM in torrential rain on the A39. Exhaustion is peaking and the van pulls into a desolate truck stop.
* **Option A: Full Trucker Meal & Espresso**
  * *Outcome:* `-45 €` Money, `+15` Stamina for all band members, `-5` Stress.
* **Option B: Shady Energy Drink from the Trunk**
  * *Outcome:* `0 €` Money, `+20` Marius Stamina, `+10` Stress, `-5` Van Fuel (van cooler ran all night).
* **Option C: 30-Minute Power Nap in the Seats**
  * *Outcome:* `+10` Band Harmony, `+5` Mood Matze & Lars, minor delay.

---

### 2.3 `traffic_jam_improv` ("Elbtunnel-Stau & Van-Akustik")
* **Category:** `band`
* **Trigger:** `travel`
* **Chance:** `0.07`
* **Narrative:** 45 minutes of dead standstill before Hamburg in summer heat.
* **Option A: Acoustic Jam & Songwriting (Skill Check: `improv` $\ge 7$)**
  * *Success:* A killer new bassline and hook are born. (`+12` Band Harmony, `+10` relationships across all members).
  * *Failure:* Out-of-tune instruments lead to bickering. (`-6` Matze Mood, `-4` Harmony).
* **Option B: Stream a Stau Rant (Skill Check: `charisma` $\ge 6$)**
  * *Success:* The raw video resonates with fans. (`+80` Social Followers, `+5` Viral Trend).
  * *Failure:* Cringe complaints spark online mockery. (`-10` Followers, `+8` Controversy).
* **Option C: Idle Van Maintenance**
  * *Outcome:* Matze tightens hoses and checks battery voltage. (`+10` Van Condition, `-8` Matze Stamina).

---

### 2.4 `reststop_trunk_dealer` ("Kofferraum-Flohmarkt am Autohof")
* **Category:** `special`
* **Trigger:** `travel`
* **Chance:** `0.06`
* **Narrative:** A battered station wagon parks next to the van. A traveler in a patched leather jacket opens their trunk full of modded pedals and illicit electronics.
* **Option A: Buy Modded Module**
  * *Outcome:* `-120 €` Money, `+1` random contraband/equipment item added to stash (`c_diy_overdrive` or similar).
* **Option B: Haggle Hard (Skill Check: `charisma` $\ge 8$)**
  * *Success:* Secure the module for a fraction of the cost. (`-60 €` Money, `+1` contraband item).
  * *Failure:* Offended, the seller packs up and drives off. (No effect).
* **Option C: Suspiciously Decline & Move On**
  * *Outcome:* `0 €` Money, `+3` Lars Mood (cautious leader).

---

### 2.5 `van_ac_heater_failure` ("Klimaanlagen-Kollaps auf der A9")
* **Category:** `transport`
* **Trigger:** `travel`
* **Chance:** `0.07`
* **Narrative:** The van blower starts whining and spews acrid dust; the interior climate becomes extreme.
* **Option A: Matze's DIY Fix (Skill Check: `technical` $\ge 8$)**
  * *Success:* Matze fixes the wiring with gaffer tape and solder. (`+15` Matze Mood, `+5` Van Condition).
  * *Failure:* Short circuit sparks and trips a fuse. (`-10` Van Condition, `+10` Band Stress, `-8` Harmony).
* **Option B: Stop at Highway Repair Shop**
  * *Outcome:* `-110 €` Money, `+15` Van Condition, `-5` Stress.
* **Option C: Windows Down & Power Through**
  * *Outcome:* `0 €` Money, `-10` Mood for all members, `-5` Stamina.

---

### 2.6 `night_drive_heart_to_heart` ("Deep-Talk im Scheinwerferlicht")
* **Category:** `band`
* **Trigger:** `travel`
* **Chance:** `0.06`
* **Narrative:** 02:00 AM on an empty country road. While the rest of the band sleeps, driver and passenger share an open conversation about the tour's purpose and fears.
* **Option A: Reminisce About Early Days & Triumphs**
  * *Outcome:* `+15` mutual relationship, `+10` Band Harmony, `-5` Stress.
* **Option B: Honest Confrontation (Skill Check: `charisma` $\ge 7$)**
  * *Success:* Cathartic breakthrough and renewed mutual respect. (`+20` relationship, `+10` Mood for both).
  * *Failure:* Bitter accusations and hurt feelings. (`-20` relationship, `-10` Band Harmony).
* **Option C: Enjoy the Quiet Road in Silence**
  * *Outcome:* `+5` Driver Mood, `-5` Band Stress.

---

## 3. Architecture & Integration Plan

### 3.1 Data File Placements
1. `src/data/events/band.ts`:
   - `van_playlist_dispute`
   - `traffic_jam_improv`
   - `night_drive_heart_to_heart`
2. `src/data/events/transport.ts`:
   - `reststop_night_coffee`
   - `van_ac_heater_failure`
3. `src/data/events/special.ts`:
   - `reststop_trunk_dealer`

### 3.2 Localization Keys
All entries will be translated with full 1:1 key parity across:
* `public/locales/de/events.json`
* `public/locales/en/events.json`

Key namespaces:
* `events:<eventId>.title`
* `events:<eventId>.desc`
* `events:<eventId>.opt<1|2|3>.label`
* `events:<eventId>.opt<1|2|3>.outcome`
* `events:<eventId>.opt<1|2|3>.successOutcome` / `failureOutcome` (for skill checks)

### 3.3 State Safety & Reducer Integrity
* All state updates flow through existing `eventEngine` delta appliers (`applyEventDelta`).
* Numeric mutations adhere to `finiteNumberOr` and existing bounds clamping (`clampBandHarmony`, `clampMemberMood`, `clampVanFuel`, etc.).
* No prototype pollution or direct mutation.

---

## 4. Verification Plan

1. **Automated Unit Tests:**
   * Create `tests/data/events/roadTripEvents.test.js`:
     * Validates all 6 event definitions against the event schema.
     * Verifies all condition and skill check paths.
     * Tests delta applications for all choices.
2. **Locale Parity Check:**
   * `node --test tests/locale/smoke.test.js` to ensure 100% German and English key coverage.
3. **Full Suite Verification:**
   * `pnpm run typecheck:core`
   * `pnpm run test`
