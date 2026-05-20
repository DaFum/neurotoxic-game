# src/schemas - Agent Instructions

- Schemas are boundary contracts. Reject unknown/hostile fields by whitelist, not by spreading parsed records.
- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) must stay stripped at nested object and array levels; security tests assert this.
- Optional numeric/string fields must preserve valid `0` and `''` values (use `??`, not `||`).
- Add or update security tests when schema hardening changes accepted input.
