# Gamepad Hardware Verification Matrix & Procedure

This document outlines the manual hardware check procedures for verifying controller functionality in Neurotoxic across supported desktop browsers (Chrome/Edge, Firefox, Safari).

## Tested Controller Classes
1. **Xbox Series X|S / Xbox One Controller** (USB-C & Bluetooth, XInput standard)
2. **PlayStation DualSense / DualShock 4 Controller** (USB-C & Bluetooth, DirectInput / WebHID standard)
3. **Generic Standard Controller** (USB-C / USB-A, W3C 'standard' mapping)

## Hardware Verification Checklist

| Area / Feature | Action & Test | Expected Outcome |
| :--- | :--- | :--- |
| **Discovery & Connect** | Plug in or pair controller via Bluetooth. Press any button. | Notification toast displays `"Controller connected: [Device Name]"`. Layout family detected correctly (Xbox vs PlayStation glyphs). |
| **Non-Standard Mapping Warning** | Connect controller with `mapping !== 'standard'`. | Toast warning displayed: `"Non-standard controller mapping detected"`. |
| **Active Input Source Tracking** | Move stick or press button on controller. | `data-input-source="gamepad"` attribute set on `<html>`. Focus ring styled with toxic green outline glow without moving selection. |
| **Spatial UI Navigation** | Press D-Pad or Left Stick in menus, Band HQ, or Overworld map. | Focus moves smoothly between interactive controls using directional cone weighting. No drift-triggered focus jumps. |
| **On-Screen Text Entry** | Select text input (e.g. Band Name) with Confirm (Button 0 / A / ✕). | `GamepadTextEntry` modal opens with on-screen character grid. Done updates native input value. |
| **Hold-to-Confirm Target** | Press & hold Confirm on `DeadmanButton` (e.g. Overworld override). | Hold progress bar fills continuously. Releasing early drains progress. Complete triggers action exactly once. |
| **Gig Rhythm Minigame** | Press bound lane buttons (default: X, A, B or custom). | Lane triggers notes without double-repeats. Held lanes release cleanly. Start button toggles pause overlay. |
| **Gig Disconnect Recovery** | Unplug controller mid-gig. | Gig pauses automatically, held lane keys are released, and toast `"Controller disconnected - Gig paused"` appears. |
| **Tourbus Minigame** | Move D-Pad / L-Stick Left & Right. | Bus changes lanes smoothly. Modals suspend movement. |
| **Roadie Minigame** | Move D-Pad / L-Stick in 4 cardinal directions. | Roadie moves step-by-step with movement cooldown. |
| **Amp Tuning** | Focus Frequency Dial range slider. Press Left / Right. | Dial adjusts in coarse steps of ±10 Hz. |
| **Controller Settings & Rebinding** | Open Settings -> Controller. Click "Rebind" on a lane. Press new button. | Rebinds lane control. Prevents assigning reserved Start button (9). Swaps controls on collision with screen reader announcement. |
| **Tab / Window Blur** | Switch browser tabs while holding buttons. | All logical buttons release, repeaters reset, and no inputs stick upon returning focus. |
