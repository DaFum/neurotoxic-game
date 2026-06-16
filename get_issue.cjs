const fs = require('fs');

console.log(`Codeant-AI flagged that we accepted 'null' and 'undefined' into 'PlayerState["location"]'. Our last fix was:
    location:
      typeof playerData.location === 'string'
        ? playerData.location
        : DEFAULT_PLAYER_STATE.location,

But we're STILL getting a failure. Let's see the exact github action annotation:
[FAILURE] File: .github, Line: 193
Message: Der Workflow blockiert den PR. Es existieren 1 NEUE ungelöste(r) Review-Thread(s):

- [codeant-ai]: **Suggestion:** The location sanitizer currently accepts null and undefined and casts them into PlayerState['location'], but that field is typed as a required string. This creates a contract break where downstream code can receive non-string locations after load. Restrict this branch to strings only (or fall back to DEFAULT_PLAYER_STATE.location) so loaded state always respects the PlayerState shape.

This might be a stale check run result, or perhaps my push didn't stick, or there is another place where we sanitize \`location\`.
Let's check if there are other places.
`);
