# src/assets - Agent Instructions

- Pollinations image URLs are valid project inputs; preserve key handling for them and route loading through `loadTexture` (do not parse Pixi textures directly).
- Audio/rhythm assets: OGG/MIDI stop at `maxNoteTime + NOTE_TAIL_MS`; procedural excerpts use full duration.
- `getGenImageUrl` in `src/utils/imageGen.ts` appends a literal trailing `&=` to every Pollinations URL — this is required by the upstream service to actually return an image. Stripping it during a URL-builder refactor silently breaks all generated images.
