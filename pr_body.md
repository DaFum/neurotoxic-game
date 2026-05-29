🎯 **What:** The testing gap for the `getGeneratedImageFallbackUrl` function in `src/utils/imageGen.ts` has been addressed. The function was missing test coverage.
📊 **Coverage:** A new test case has been added to `tests/node/imageGen.test.js` to ensure that `getGeneratedImageFallbackUrl` returns the correct constant offline fallback SVG string (`/images/generated-offline-fallback.svg`).
✨ **Result:** Test coverage in `imageGen.ts` is improved, ensuring the offline fallback URL is reliably tested and preventing unintended regressions in fallback image generation logic.
