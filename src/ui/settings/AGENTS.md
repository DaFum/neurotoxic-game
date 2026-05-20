# src/ui/settings - Agent Instructions

- Slider/input handlers may deliver strings; parse a finite number appropriate to the control (`parseFloat` for 0..1 volume, base-10 `parseInt` for log level), reject null/undefined/NaN, and clamp or validate to the allowed range before dispatch.
- Mute / music / SFX volume of `0` is valid — use nullish checks (`??`), never truthy checks, when reading these values.
