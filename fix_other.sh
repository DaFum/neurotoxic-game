#!/bin/bash

# Also replace isLooseRecord with isPlainRecord in questLifecycle.ts where they cast
sed -i 's/\bisLooseRecord\b/isPlainRecord/g' src/domain/questLifecycle.ts

# We need to make sure isPlainRecord is imported where we changed it.
# In src/domain/questLifecycle.ts:
sed -i 's/isLooseRecord/isPlainRecord/g' src/domain/questLifecycle.ts

# In src/context/reducers/systemReducer.ts:
sed -i 's/isLooseRecord,/isPlainRecord,/g' src/context/reducers/systemReducer.ts
