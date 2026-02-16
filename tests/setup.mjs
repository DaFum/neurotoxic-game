import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register the loader relative to this file
register('./loader.mjs', import.meta.url);
