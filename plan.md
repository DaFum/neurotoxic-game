1. **Fix `createSetLastGigStatsAction` in `src/context/actionCreators.ts`**:
   - Change `payloadWithToastId` type to `PostGigSummary`.
   - Avoid `as never` cast when returning the payload. Ensure field normalization remains intact and `toastId` is assigned.
   - We will need to read `src/types/gig.d.ts` further to see what `PostGigSummary` actually allows in terms of index signature or type definition so we can still do `stats[field]` iteration.

2. **Fix `SOCIAL_FIELDS` and `sanitizeSocialUpdates` in `src/context/actionCreators.ts`**:
   - Define `SOCIAL_FIELDS` with `as const satisfies Record<keyof SocialState, { numeric?: boolean; nullable?: boolean }>` or similar based on `keyof SocialState`.
   - Update `sanitizeSocialUpdates` to use `Object.hasOwn` correctly. Ensure no type widenings for `SOCIAL_FIELDS`.
   - Add regression tests to `tests/node/actionCreators.test.js` covering every entry in the `SOCIAL_FIELDS` normalization table (e.g. verifying finite numbers, rejection of NaN/Infinity, zero preservation, nullable handling). Add tests for `STAT_FIELDS`.

3. **Update `copySafeEffectPayload` and `copySafeFlatObject` in `src/context/reducers/sanitizers/stateSanitizers.ts`**:
   - In `copySafeEffectPayload`, branch on the root shape (array vs. object). Preserve direct primitive fields for object array entries while rejecting root primitives and non-record entries before casting.
   - In `copySafeFlatObject`, sanitize only direct record fields, drop nested values, and convert an empty result to null.
   - Add regression tests covering object entries in effect arrays, primitive effect payloads, and nested flat-object fields. (We need to find the correct test file for stateSanitizers, possibly create `tests/node/stateSanitizers.test.js` or add to an existing file).

4. **Update `sanitizeTraversableValue` in `src/utils/objectUtils.ts`**:
   - In the array-pruning loop, if missing indices are encountered (sparse arrays), set `modified` to `true` to allow returning the compacted `prunedArray`.
   - We will run the tests in `tests/node/objectUtils.test.js`.

5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done**:
   - Run tests for `actionCreators`, `objectUtils`, and any `stateSanitizer` test files.
   - Run linting on modified files using `pnpm eslint`.

6. **Submit code**.
