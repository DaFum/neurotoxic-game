#!/bin/bash
cat src/hooks/useGigVisuals.ts | grep -n -B 5 -A 10 "isImageGenerationAvailable"
