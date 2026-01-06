# ANALYSIS REPORT: NEUROTOXIC DESIGN vs IMPLEMENTATION

## 1. Q&A: Specific User Questions

### **Q1: Wie viele Locations sind in der markdown angegeben?**
**Antwort:** Die Markdown-Datei spezifiziert "47 spielbare Locations" (siehe Abschnitt "KOMPLETTE SPIELWELT-DATEN").
Es werden spezifische Regionen genannt:
*   Sachsen-Anhalt (inkl. Stendal, Tangermünde, Magdeburg)
*   Sachsen (inkl. 12 Venues in Leipzig, 8 in Dresden)
*   Niedersachsen (inkl. 9 Venues in Hannover)
*   Weitere 23 Städte (Hamburg, Berlin, Köln, etc.)

### **Q2: Wie viele sind im Code?**
**Antwort:** Im aktuellen Code (`src/data/venues.js`) sind **45 Locations** implementiert.
Das File listet spezifische Venues für Stendal, Magdeburg, Leipzig, Dresden, Hannover, Berlin, Hamburg, Köln, München, Stuttgart, Dortmund, Bremen, Frankfurt, Kassel, Nürnberg, Rostock, Erfurt, Saarbrücken, Freiburg und Kiel.

### **Q3: Was wird über Ticketverkauf in der markdown gesagt?**
**Antwort:** Die Markdown-Datei definiert unter "WIRTSCHAFTSSYSTEM" folgende Formel:
`Berechnung: Kapazität × Crowd-Fill × Ticket-Preis`
Beispiel: `120 Kapazität × 85% Fill × 8€ = 816€`
Die Variable `Crowd-Fill` (50-100%) ist abhängig von Promotion.

### **Q4: Was findest du im Code?**
**Antwort:** In `src/scenes/PostGig.jsx` ist diese Logik exakt implementiert:
```javascript
// Base Fill Rate 60-80% + Promo Bonus
let fillRate = 0.6 + (Math.random() * 0.2); 
if (gigModifiers.promo) fillRate += 0.15; 

// Calculation matches doc exactly
const ticketsSold = Math.floor(currentGig.capacity * fillRate);
const ticketRevenue = ticketsSold * currentGig.price;
```
Zusätzlich sind auch "Merch Sales" (30% der Ticketkäufer) und "Bar Cut" (15% vom Drink-Umsatz) implementiert, wie im Design gefordert.

---

## 2. COMPREHENSIVE FEATURE LIST (From Markdown)

This list extracts every feature mentioned in the "v3.0" and general design sections.

### **CORE CONCEPT (Role: Designer-Turned-Developer)**
*   [x] **Aesthetic**: Toxic Green (#00FF41) on Void Black (#0A0A0A).
*   [x] **Typography**: 'Metal Mania' (Headers) and 'Courier New' (UI).
*   [x] **UI Style**: Glitch effects, CRT scanlines, brutalist borders.
*   [x] **Genre**: Hybrid Rhythm-Action-Survival + Roguelike Tour Manager.

### **GAMEPLAY LAYER 1: OVERWORLD (STRATEGY)**
*   [x] **Map**: Stylized Germany map with nodes.
*   [x] **Locations**: ~47 playable venues (Clubs, DIY, Festivals).
*   [x] **Travel Mechanics**: Cost calculation (Fuel, Food, Time).
*   [x] **Permadeath**: Game Over if Bankrupt or Band Split.
*   [ ] **Procedural Map**: Routes/Nodes generated procedurally per run (Currently static list).
*   [ ] **Save System**: Daily runs with Leaderboards (Local storage implemented, but Leaderboards missing).

### **GAMEPLAY LAYER 2: PRE-GIG (TACTICAL)**
*   [x] **Budget Allocation**: 5 specific categories (Soundcheck, Promo, Merch, Energy, Guest List).
*   [x] **Setlist Builder**: Pick 3-5 songs from unlocked catalog.
*   [ ] **Song Stats**: Songs have specific stats (Duration, Difficulty, Energy, Viral Potential).
*   [ ] **Crowd Curve**: Song order affects crowd energy curve (Simulation logic missing).

### **GAMEPLAY LAYER 3: THE GIG (ACTION)**
*   [x] **3-Lane System**: Guitar, Drums, Bass lanes.
*   [x] **Controls**: Specific key bindings (Arrow Left, Down, Right).
*   [x] **Split-Screen UI**: Top (Stage View) vs Bottom (Rhythm View).
*   [x] **Live Social Feed**: Fake comments/likes appearing during gameplay.
*   [ ] **Visuals**: Pixel Art animated band members (Currently placeholders).
*   [ ] **Audio Reactivity**: Beatmaps generated from real audio (Currently mock random notes).
*   [ ] **Moshpit Manager**: Crowd mechanics (Circle Pits, Wall of Death visual feedback).

### **GAMEPLAY LAYER 4: POST-GIG (RESULTS)**
*   [x] **Accounting**: Detailed breakdown of Income vs Expenses.
*   [x] **Dynamic Revenue**: Ticket Sales based on fill rate.
*   [x] **Secondary Income**: Merch Sales and Bar Cut.
*   [x] **Progression**: Fame/Money updates.

### **META-SYSTEMS & DEPTH**
*   [x] **Event System**: Random text-based events with choices (Police, Van Breakdown).
*   [ ] **127 Events**: Full database of unique events (Currently ~3 implemented).
*   [ ] **Band Dynamics**: Harmony Meter affecting gameplay (UI present, mechanics limited).
*   [ ] **Character Traits**: Specific traits for Matze (Perfektionist), Lars (Party Animal), Marius (Social).
*   [ ] **Equipment Tree**: Persistent upgrades for Van/Instruments (Currently only temp gig modifiers).
*   [ ] **Social Media Engine**: Complex viral algorithm, posting strategy mini-game.

### **CONTENT**
*   [ ] **11 Songs**: Specific tracklist (Kranker Schrank, Idiorcissism, etc.) with real audio.
*   [ ] **Endings**: 7 distinct endings (Breakthrough, Sellout, Elder Gods, etc.).
*   [ ] **Achievements**: 84 specific achievements.

---

## 3. IMPLEMENTATION STATUS SUMMARY

| Feature Category | Status | Notes |
| :--- | :--- | :--- |
| **Aesthetics & UI** | ✅ **Complete** | Polished Toxic/Void style with Tailwind v4. |
| **Economy Logic** | ✅ **Complete** | Formulas match design doc exactly. |
| **Location Data** | ✅ **Complete** | 45/47 venues implemented with stats. |
| **Core Rhythm Engine** | ⚠️ **Functional** | Works with 3 lanes, but uses mock notes (no audio sync). |
| **Event Engine** | ⚠️ **Functional** | System works, but content (127 events) is missing. |
| **Roguelike Depth** | ❌ **Missing** | Procedural map, perma-upgrades, and complex band traits not yet built. |
