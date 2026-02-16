import { register } from 'node:module';

// Register the loader relative to this file
register('./loader.mjs', import.meta.url);
