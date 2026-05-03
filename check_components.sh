#!/bin/bash
cat src/scenes/MainMenu.tsx | grep -n -B 5 -A 10 "isImageGenerationAvailable" || echo "Not found in MainMenu.tsx"
cat src/ui/BandHQ.tsx | grep -n -B 5 -A 10 "isImageGenerationAvailable" || echo "Not found in BandHQ.tsx"
cat src/ui/bandhq/ShopItem.tsx | grep -n -B 5 -A 10 "isImageGenerationAvailable" || echo "Not found in ShopItem.tsx"
cat src/ui/ContrabandStash.tsx | grep -n -B 5 -A 10 "isImageGenerationAvailable" || echo "Not found in ContrabandStash.tsx"
