# Audit Record R03: Proxy Rate Limit Trust Boundary & Shared-IP Contention

Date: 2026-10-22
Branch: `claude/sleepy-meitner-2se36i`
Audit Finding ID: R03 (Rate Limit Bypass & Proxy Trust Boundary)

---

## 1. Context & Proxy Trust Boundary Overview

### 1.1 IP Normalization Mechanics
Client IP selection in `normalizeIp` (`lib/apiUtils.js`) determines the rate-limit bucket key (`rate_limit:<endpoint>:<ip>`):
- **Default Mode (`TRUST_PROXY !== 'true'`)**: Ignores all forwarding headers (`x-real-ip`, `x-forwarded-for`) and relies solely on `req.socket.remoteAddress`.
- **Trusted Mode (`TRUST_PROXY === 'true'`)**:
  - Checks `x-real-ip` first. If non-blank string, trims it and returns it verbatim without IP format validation or a socket-peer check (verifying that `req.socket.remoteAddress` belongs to a trusted reverse proxy IP).
  - If `x-real-ip` is absent/blank, parses `x-forwarded-for` and selects the last IP in the chain (the immediate proxy hop).

### 1.2 Deployment Topology
- Only the frontend static web assets deploy from this repository to GitHub Pages.
- The backend API hosting platform, ingress proxy topology, and runtime `TRUST_PROXY` environment configuration are unmanaged and undocumented within this codebase.
- The ticket assumes no live proxy or auth misconfiguration currently in production.

---

## 2. Operator Verification Checklist

Operators deploying or maintaining the API backend must execute this checklist to verify proxy trust boundaries and rate-limit bucket isolation.

### 2.1 Verification Steps
1. **Identify Hostnames**: Identify every API hostname, including preview, staging, and alternate origin endpoints.
2. **Record Environment Configuration**: Record the runtime `TRUST_PROXY` setting (`true` or unset) for each deployment environment.
3. **Public Ingress Header Rotation Probe**:
   - Send six invalid-payload `POST` requests to `/api/leaderboard/stats` through public ingress.
   - On each request, vary spoofed `x-real-ip` (e.g. `10.0.0.1`, `10.0.0.2`, ...) and `x-forwarded-for` headers.
4. **Direct-Origin Probe**: Repeat step 3 directly against origin hostnames, bypassing public ingress if accessible.
5. **Bucket Isolation Verification**: Verify that two test clients on distinct networks do not share a single rate-limit bucket.

### 2.2 Expected Results & Safeguards
- **Invalid Payload Safety**: Requests with invalid payloads (e.g., missing mandatory `playerId` or `playerName`) return `HTTP 400 Bad Request` prior to database writes, but consume a slot in the Redis rate-limit counter (`INCR`).
- **Public Ingress Result**: The safe public ingress outcome is `HTTP 429 Too Many Requests` on the 6th request regardless of rotated `x-real-ip` or `x-forwarded-for` headers.
- **Direct-Origin Result**: Direct origin or alternate hostnames must either be unreachable (network/firewall blocked) or return `HTTP 429` on the 6th request.
- **Unset `TRUST_PROXY` Hazard**: Running behind a reverse proxy with `TRUST_PROXY` unset causes all clients to share `req.socket.remoteAddress` (the proxy IP), placing all global users into a single rate-limit bucket.

### 2.3 Operator Decision Tree
- Record hostnames, `TRUST_PROXY` values, probe HTTP status codes, and execution date.
- **Pass Outcome**: If all probes pass (429 on 6th request across spoofed headers; isolated buckets for distinct IPs), close finding R03 with evidence and date.
- **Header Rotation Failure**: If varying headers rotates rate-limit buckets through public ingress, open a follow-up ticket to:
  - Configure the ingress proxy to strip or overwrite `x-real-ip` and `x-forwarded-for`.
  - Or update `normalizeIp` to remove the `x-real-ip` branch or add a proxy-peer allowlist.
- **Shared Bucket Failure**: If all users collide in a single bucket behind a proxy, open a follow-up ticket to configure `TRUST_PROXY=true` in the environment.

---

## 3. Shared-IP Contention & Client Recovery Analysis

### 3.1 Phase 2 Test Results
- **Test Suite**: `tests/node/leaderboardSyncController.test.js` under block `describe('shared-IP contention, 429 backoff, and recovery')`.
- **Contention Behavior**: When >5 players share a single IP (e.g. 7 players across multiple tabs/devices), the server accepts the first 5 requests (`HTTP 200 OK`) within a 60-second window. The 6th and 7th requests receive `HTTP 429 Too Many Requests`.
- **Exponential Backoff**: Affected client controllers double their retry backoff from 30s to 60s, up to the maximum cap `MAX_RETRY_INTERVAL_MS = 300` seconds (5 minutes).
- **Recovery**: Once the server's 60-second window expires, pending snapshots retry successfully and persist under `neurotoxic_last_synced_snapshot:${playerId}`.
- **Sync Non-Disabling**: `HTTP 429` errors increment failure counters and initiate retry backoff, but do NOT disable stat sync for the session (unlike `HTTP 404`).
- **Jitter Limitation**: Identical request timing produces identical retry timing because `leaderboardSyncController` currently contains no randomized retry jitter.

### 3.2 Explicit Upper Bounds & Derivations
1. **Confirmation Upper Bound after State Changes Stop**:
   - *Derivation*: `Backoff Cap (300s) + Window Duration (60s) = 360 seconds` (360,000 ms).
   - Once state changes cease, the newest pending snapshot is guaranteed to achieve confirmation and storage within 360 seconds in worst-case window alignment.
2. **Upper Bound on Denied Requests Per Window**:
   - *Derivation*: With $N_b$ players backing off at cap ($I \ge 60\text{s}$ up to $300\text{s}$), each player issues at most 1 retry per 60-second window.
   - Total denied (`429`) requests across all backing-off players per 60-second window is strictly upper-bounded by $N_b$.

### 3.3 Follow-up Candidate Enhancements
If the 360-second worst-case recovery duration under shared-IP contention is deemed unacceptable for high-density environments (e.g. LAN events or shared office egresses), candidates for future enhancement include:
- Server-side `Retry-After` header support in 429 responses.
- Client-side randomized retry jitter in `leaderboardSyncController`.

---

## 4. Song Submission Helper & Honor-Based Ranking Model

### 4.1 Song Submission Helper Behavior
- Helper: `submitLeaderboardScores` in `src/utils/leaderboardUtils.ts`.
- Evaluated against separate rate-limit bucket: `rate_limit:song:<ip>`.
- Does **not** perform automatic retries upon receiving `HTTP 429`. It logs the warning/error and ignores the failure. This behavior is intentional and preserved.

### 4.2 Honor-Based Trust Model Scope
- Leaderboard rankings remain strictly **honor-based**.
- The client-generated `playerId` (stored in `localStorage`) is the sole write credential.
- Monotonic revisions (`revision`) prevent stale request overwrites during out-of-order delivery; they do **not** prevent fabricated scores or modified client binaries.
- Verified competitive leaderboards require authenticated player identity and server-side gameplay/score verification under a separate design.
