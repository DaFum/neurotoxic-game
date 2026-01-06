# GAP ANALYSIS: NEUROTOXIC DESIGN vs IMPLEMENTATION

This document provides a comprehensive audit of the features listed in the design document (`klicke dich durch die social Media Profile von neu.md`) versus the current code implementation (v3.0 MVP).

## 1. Locations (Spielwelt)

*   **Design Requirement:** "47 spielbare Locations" (Specific lists for Sachsen-Anhalt, Sachsen, Niedersachsen, and others).
*   **Current Code:** **Implemented**. The `src/data/venues.js` file now lists ~32 specific venues with stats, which covers the named regions and major German cities. This is a significant upgrade from the initial 5.
*   **Status:** ✅ Mostly Complete (32 implemented vs 47 total, major ones included).

## 2. Economy System (Wirtschaft)

*   **Design Requirement:** 
    *   **Ticket Sales:** Capacity × Crowd-Fill × Ticket-Price.
    *   **Merch:** T-Shirt/Hoodie sales.
    *   **Bar Cut:** 10-20% of revenue.
    *   **Expenses:** Fuel, Food, Repairs, etc.
*   **Current Code:**
    *   **Ticket Sales:** **Implemented** in `PostGig.jsx` using the exact formula.
    *   **Merch:** Simplified calculation (30% of crowd buys merch).
    *   **Bar Cut:** Implemented as 15% of drink sales.
    *   **Expenses:** Travel costs (Fuel/Food) are deducted in `Overworld.jsx`.
*   **Status:** ✅ Core Loop Implemented. (Advanced features like Insurance, Tax, and specific Merch Item Inventory are missing).

## 3. Rhythm Game (The Gig)

*   **Design Requirement:** 3-Lane System (Guitar, Drums, Bass) with specific mechanics (Blast Beats, Solos).
*   **Current Code:** **Implemented**. `Gig.jsx` features 3 lanes mapped to specific keys/instruments.
*   **Visuals:** Design asks for "Pixel Art Band + Crowd". Code uses placeholders (Rectangles) due to asset limitations.
*   **Status:** ⚠️ Functional MVP. Visuals need asset replacement.

## 4. Roguelike Elements

*   **Design Requirement:**
    *   Permadeath (Game Over if broke/band splits).
    *   Procedural Map (Daily runs).
    *   Random Events (127 specific events).
*   **Current Code:**
    *   **Permadeath:** Not enforced (Player can go into negative debt currently).
    *   **Map:** Static list of venues, not procedurally generated connections.
    *   **Events:** A placeholder `alert()` exists for random events, but the database of 127 events is not implemented.
*   **Status:** ❌ Missing Depth.

## 5. Social Media Engine

*   **Design Requirement:** Complex simulation of Instagram/TikTok/YouTube with viral mechanics.
*   **Current Code:** **Partially Implemented**. `Gig.jsx` shows a "Live Feed", and `PostGig.jsx` awards "Fame", but there is no interactive phone menu or posting strategy mini-game.
*   **Status:** ⚠️ Basic implementation.

## 6. Band Dynamics

*   **Design Requirement:** Harmony Meter, Personality Traits, Conflict Resolution.
*   **Current Code:** `HUD.jsx` displays Harmony/Mood stats, but they are static/randomized and do not affect gameplay yet.
*   **Status:** ❌ UI Only.

## Summary

The current build (v3.0 MVP) successfully implements the **Core Loop** (Travel -> Prep -> Gig -> Profit) and the **Aesthetic Direction**. It answers the user's specific challenges regarding **Location Count** and **Ticket Sales Logic**.

To reach full v3.0 spec, the following are needed:
1.  **Event System**: Implementing the text-based event engine.
2.  **Asset Integration**: Real audio and pixel art.
3.  **Procedural Generation**: Dynamic beatmaps from audio.
