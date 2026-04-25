import sys
with open("src/components/overworld/OverworldMap.tsx", "r") as f:
    content = f.read()

import re

# Since I already updated map-wrap className in previous step via `replace_map_wrap.py` let's verify it
if 'map-wrap' in content:
    print("map-wrap is present")
else:
    print("map-wrap is MISSING")
