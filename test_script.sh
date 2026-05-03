#!/bin/bash
cat src/components/stage/EffectTextureManager.ts | grep -n -A 20 -B 10 'dispose'
