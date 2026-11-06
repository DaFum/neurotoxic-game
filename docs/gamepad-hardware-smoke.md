<!-- coderabbit-ai-generated:v1 -->

# Gamepad hardware smoke test

Run on supported desktop Chrome, Firefox, and Edge with an Xbox controller and a PlayStation controller, each over USB and Bluetooth, and with a generic standard-mapped controller. Record the browser and OS versions and controller model for each run.

- [ ] Press a controller button and confirm discovery. Record `id` and `mapping` from `navigator.getGamepads()`. Check the non-standard warning for a device without standard mapping.
- [ ] Check all face buttons, D-pad directions, left stick, shoulders, and triggers. Check that stick drift at rest does not move focus or change input hints.
- [ ] Rebind each rhythm lane, swap two bindings, cancel capture, reject Start, reset defaults, and reload to confirm persistence.
- [ ] Navigate menus, map, preparation, events, dialogs, sliders, tabs, hold controls, and alias entry using only the controller. Confirm that a map node selects on the first press and travels only on the second.

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:56062b9194fb23bbc558f6f1a32e7b2b6f0d3541afc7720f717cffe5f5f1529a -->

- [ ] During a Gig hold a lane, disconnect the last controller, verify release and pause, reconnect, and resume. With two controllers, disconnect one while the other holds a lane: verify the remaining hold continues and the Gig stays active. Repeat with a hidden and restored tab and with window focus lost and regained.

<!-- /coderabbit-ai-generated:v1 -->

- [ ] Check controller audio unlock. If the browser requires a click or tap, verify the fallback hint and the retry path.
- [ ] Play Tourbus, Roadie, Amp Calibration, and Kabelsalat through completion, then complete a controller-only run from the main menu to the result.
