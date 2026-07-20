#!/bin/bash
cat << 'INNER_EOF' > /tmp/redundant_cast.patch
--- src/context/reducers/sanitizers/stateSanitizers.ts
+++ src/context/reducers/sanitizers/stateSanitizers.ts
@@ -1172,7 +1172,7 @@
     ['zealotry', clampZealotry]
   ] as const) {
     const parsed = finiteOptionalNumber(safeValue[key])
-    if (parsed !== undefined) sanitized[key] = clampFn(parsed as number)
+    if (parsed !== undefined) sanitized[key] = clampFn(parsed)
   }

   for (const key of [
INNER_EOF
patch src/context/reducers/sanitizers/stateSanitizers.ts /tmp/redundant_cast.patch
