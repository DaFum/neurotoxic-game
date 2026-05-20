# src/ui/settings - Agent Instructions

- Slider/input handlers may deliver strings; coerce and range-validate before dispatch.
- Mute / music / SFX volume of `0` is valid — use nullish checks (`??`), never truthy checks, when reading these values.
