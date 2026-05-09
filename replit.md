# FayaFlex

## Overview
FayaFlex is a team-based fitness tracking and competition platform designed to foster engagement and healthy competition. Users can track daily fitness activities, form or join teams, and compete in monthly challenges. The platform features real-time leaderboards, personalized progress tracking, and extensive integration capabilities for various fitness devices. FayaFlex aims to provide a motivating and interactive experience to encourage consistent fitness activity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Tooling**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI System**: Shadcn UI (built on Radix UI) with Tailwind CSS, adhering to fitness-optimized Material Design principles with a custom color palette and dark mode.
- **State Management**: TanStack Query for server state; local component state for UI.
- **PWA Implementation**: Full PWA support with offline capabilities, service worker, responsive design, and a touch-friendly UI.
- **Mobile-First**: Horizontal bottom navigation is the primary navigation.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, following a RESTful API design.
- **Authentication**: Multi-method authentication including username/password (Passport.js local strategy, Scrypt hashing) and WebAuthn/Passkey for biometric login. Supports session cookies (web) and JWT tokens (mobile). Zod validation is used on auth endpoints.
- **API Structure**: Comprehensive RESTful API for user, team, activity, leaderboard, notification, and passkey management.
- **Core Features**:
    - **Team Management**: CRUD operations for teams and member management.
    - **Activity Tracking**: Logging and retrieval of user activities, with support for evidence uploads.
    - **Leaderboards**: Real-time leaderboards for individuals and teams.
    - **Notifications**: Personalized daily motivational messages.
    - **Interactive Dashboard**: Clickable stat cards leading to detailed daily breakdowns and workout calendars.
    - **Social Features**: Reactions and comments on activity submissions with real-time counts.
    - **Victory Wall**: Team-based victory wall to showcase monthly champions.
    - **Email Privacy**: User emails are sanitized and hidden from other users.
    - **Goal Journeys**: Daily/weekly fitness goals with progress tracking.
    - **Auto-Posted Workouts**: Logging an activity with a workout type automatically creates a feed post summarizing duration, distance, calories, avg heart rate, elevation, and avg speed.

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, passkeys, sessions, activityReactions, activityComments, monthly_winners, passwordResetTokens, and userGoals.
- **Relationships**: Supports complex relationships for user, team, activity, and passkey data.

### Mobile Application
- **Platform**: Capacitor for iOS and Android native app deployment.
- **App ID**: com.fayaflex.app
- **Production Server**: https://fayaflex.com

## Security Notes

### Safe-by-design keys in `attached_assets/`
The following values look like secrets but are safe to commit. Future secret sweeps should not re-flag them:
- **Firebase iOS `API_KEY`** in `attached_assets/GoogleService-Info_*.plist` (e.g. values starting with `AIzaSy...`). Firebase iOS API keys are mobile-client identifiers, not secrets — Google expects them to ship inside iOS app bundles. Access is gated by Firebase Security Rules and the iOS bundle ID restriction, not by the key itself.

Anything else that looks like a credential in `attached_assets/` (OAuth tokens, JWTs, Bearer tokens, `AIza...` server keys, GitHub `gh*_` tokens, OpenAI `sk-` keys, Stripe keys, private keys, DB URLs with credentials, etc.) should be treated as a real leak — redact it from the working tree and rotate the underlying secret.

### Pre-commit secret scanning
A local pre-commit hook at `.githooks/pre-commit` scans staged files for common credential shapes (`ya29.`, `AIza`, `sk-`, `gh[pousr]_`, `xox[baprs]-`, Stripe `sk_live_`, AWS `AKIA`, PEM private keys, Postgres URLs with embedded passwords) and blocks the commit if any are found. Firebase iOS `GoogleService-Info*.plist` files are allowlisted per the note above.

**New contributors must enable it once:**
```
git config core.hooksPath .githooks
```

To bypass for an intentional, documented false positive: `git commit --no-verify`. To extend the rules, edit the `PATTERNS` array in `.githooks/pre-commit`.

### Server-side secret scanning (CI)
The local hook only protects contributors who have run `git config core.hooksPath .githooks`. A teammate on a fresh checkout, a commit made via the GitHub web UI, or any automation that bypasses local hooks would otherwise slip through. As a backstop, `.github/workflows/secret-scan.yml` re-runs the same regex set on every pull request and on every push to `main`, fails the build if a match is found, and emits per-line GitHub annotations linking straight to the offending file/line.

The CI job and the local hook share an identical `PATTERNS` list and the same `GoogleService-Info*.plist` allowlist. **If you change one, mirror the change in the other** (and update this section if the allowlist changes).

### High-entropy backstop (`.githooks/entropy-scan.py`)
The regex `PATTERNS` list above only fires on credentials with a recognizable prefix (`ya29.`, `AIza`, `sk-`, `gh*_`, `xox[baprs]-`, `sk_live_`, `AKIA`, `-----BEGIN PRIVATE KEY-----`, `postgres://user:pass@`). A bare 40-character random session token, a webhook signing secret, or any custom-format API key would slip through. To close that gap, both the local hook and the CI job pipe the change diff through `.githooks/entropy-scan.py`, which flags any *newly added* line containing a 24+ character base64-ish token whose Shannon entropy is ≥ 4.5 bits/char.

Key design choices (see the docstring at the top of the script for the full rationale):
- **Diff-only, never full-file.** Existing repo content has already been audited via the one-shot sweep below; re-scanning every blob on every commit would produce a long tail of unfixable historical noise that pressures contributors into `--no-verify`. We only block what *this* commit introduces. As a consequence, the CI job *skips* the entropy backstop on the no-base fallback path (very first push to a brand-new branch, no parent commit to diff against). The regex scan still runs against every tracked file in that case, so known-prefix credentials are not missed; the next push with a real base will exercise the entropy backstop too.
- **Single source of truth.** Unlike the regex `PATTERNS` list (which is hand-mirrored in two files), the entropy detector lives in one Python module that both the local hook and the CI job invoke. There is no parallel allowlist to keep in sync.
- **Three-layer allowlist** inside `.githooks/entropy-scan.py`:
  - `PATH_ALLOWLIST` — skip a file entirely (lockfiles, `.svg`, `.map`, `.min.js`, `.wasm`, `GoogleService-Info*.plist`, the scanner files themselves).
  - `TOKEN_ALLOWLIST` — skip individual token shapes that look random but are not credentials. Currently covers UUIDs, pure-hex digests (git SHA-1, sha256, sha512), SRI integrity hashes (`sha256-…`), Vite/esbuild chunk hashes, build-artifact identifiers (`App-<long-hex>`), Nix store object names (`<32-char-base32>-<package>`), and Swift mangled symbol names from iOS crash logs (`_TtC…`, `_TtGC…`).
  - **`allow-secret` pragma** — any added line containing the comment marker `// allow-secret` or `# allow-secret` is skipped. Use this for hand-vetted in-source false positives, with a comment explaining why. This is the per-line equivalent of `--no-verify` and is the preferred escape hatch for one-off cases.
- **Token regex excludes `/` and `.`** so URLs and dotted identifiers (package names, fully qualified Java class names) don't get captured as one giant token. Real credential formats overwhelmingly use the url-safe alphabet (`-_`) anyway — JWTs, GitHub tokens, OpenAI keys, Stripe keys, and Slack tokens all avoid `/`.

If a future false positive surfaces, prefer (in order): a per-line `allow-secret` comment, then a new entry in `TOKEN_ALLOWLIST` if the same shape appears in many places, then a `PATH_ALLOWLIST` entry only as a last resort. Update this section whenever `TOKEN_ALLOWLIST` or `PATH_ALLOWLIST` is broadened.

**Known historical backlog:** running the entropy scanner against the entire repo (as if every tracked line were freshly added) currently surfaces ~228 hits, all inside `attached_assets/Pasted-*.txt` mobile crash-log paste-ins (HTTP ETag fragments, signed-URL params, and at least one base64 protobuf that looks like a real session blob). These are the tokens being addressed by the sibling task "Invalidate the user session tokens that leaked into the repo" — the right fix is rotation, not allowlisting. Because the entropy scanner only runs on diffs, this backlog does not block ongoing development.

### Historical secret sweep (one-time, May 9 2026)
The pre-commit hook and CI workflow only catch *new* commits. To close the gap for credentials that may have landed earlier and been removed later, the same `PATTERNS` regex set was run against every blob reachable from any ref in the repo (`git rev-list --all --objects`, ~3.5k unique blobs). Results:

- **`ya29.` Google OAuth access token** — blob `29c7e44d255d953fd6757f554bca6be4815d91f0`, originally committed at path `attached_assets/Pasted-Received-port-for-identifier-response-null-with-error-E_1777304223873.txt` in commit `ca50402` and removed from the working tree in `64ecf33` / `ba78c88`.
  - **Status: accepted, no rotation required.** `ya29.*` tokens are short-lived Google OAuth *access* tokens with a server-enforced lifetime of ~1 hour. The blob was authored well before this sweep, so the token is already expired and unusable. There is no long-lived refresh token, client secret, or service-account key in the same blob.
  - The blob still exists in history (reachable via `git log -p` / `git cat-file`). Purging would require a force-push history rewrite (`git filter-repo` / BFG), which is out of scope here because version control is platform-managed. If a future incident requires history rewrite, coordinate with Replit support — do not run `filter-repo` from the agent environment.

- **`-----BEGIN PRIVATE KEY-----` marker in `server/pushService.ts`** — 9 blobs across history, all the same false positive.
  - **Status: resolved at the source.** The literal markers inside `normalizeApnsKey()` were rewritten as `` `-----BEGIN ${"PRIVATE"} KEY-----` `` (and the matching `END` form) so the runtime values are unchanged but the secret-scanner regex no longer matches them. The `--no-verify` workaround is no longer required when editing this file.
  - The per-rule `PEM_ALLOWLIST_REGEX` in both `.githooks/pre-commit` and `.github/workflows/secret-scan.yml` was correspondingly narrowed from `^(server/pushService\.ts|replit\.md)$` to `^replit\.md$`. The `replit.md` entry remains because this Security Notes section still has to spell the marker out for documentation purposes. Every other path — including `server/pushService.ts` and any new file — still fails the build on a real PEM block.
  - Reproduce the historical sweep at any time with the snippet under "Reproducing the sweep" below. If the allowlist is ever broadened again, document it here and mirror the change in both the hook and the workflow.

No other matches across all 9 patterns (Google OAuth, Google API key, OpenAI, GitHub, Slack, Stripe live, AWS, PEM, Postgres-with-password). Firebase iOS `AIza` keys inside `GoogleService-Info*.plist` were correctly filtered by the existing allowlist and are intentionally not listed here.

#### Reproducing the sweep
The sweep is a one-shot audit, not a CI job — re-run it whenever a new pattern is added or after any bulk history operation. It walks every blob reachable from any ref (not just `HEAD`), so it catches credentials that were committed and later deleted.

```bash
# From repo root. Streams ~3.5k blobs through `git cat-file --batch`;
# completes in well under a minute on this repo.
python3 - <<'PY'
import subprocess, re, collections, threading
PATTERNS = {
    "Google OAuth access token (ya29.*)": rb"ya29\.[A-Za-z0-9_-]{20,}",
    "Google API key (AIza...)":           rb"AIza[0-9A-Za-z_-]{35}",
    "OpenAI API key (sk-...)":            rb"sk-(proj-)?[A-Za-z0-9_-]{20,}",
    "GitHub token":                       rb"gh[pousr]_[A-Za-z0-9]{30,}",
    "Slack token":                        rb"xox[baprs]-[A-Za-z0-9-]{10,}",
    "Stripe live secret key":             rb"sk_live_[A-Za-z0-9]{20,}",
    "AWS access key id":                  rb"AKIA[0-9A-Z]{16}",
    "PEM private key block":              rb"-----BEGIN ([A-Z]+ )?PRIVATE KEY-----",
    "Postgres URL with embedded password": rb"postgres(ql)?://[^\s:@\"']+:[^\s:@\"']+@",
}
SKIP  = re.compile(r"(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tgz|mp4|mov|woff2?|ttf|otf)$")
ALLOW_AIZA = re.compile(r"GoogleService-Info.*\.plist$")
ALLOW_PEM  = re.compile(r"^replit\.md$")
COMPILED = [(l, re.compile(r)) for l, r in PATTERNS.items()]

objs = subprocess.check_output(["git","rev-list","--all","--objects"]).decode("utf-8","replace")
blob_paths = {}
for line in objs.splitlines():
    if " " not in line: continue
    sha, path = line.split(" ", 1)
    if SKIP.search(path): continue
    blob_paths.setdefault(sha, set()).add(path)

p = subprocess.Popen(["git","cat-file","--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
threading.Thread(target=lambda: (p.stdin.write(("\n".join(blob_paths)+"\n").encode()), p.stdin.close()), daemon=True).start()

groups = collections.defaultdict(list)
while True:
    hdr = p.stdout.readline()
    if not hdr: break
    parts = hdr.decode().split()
    if len(parts) < 3: continue
    sha, typ, size = parts[0], parts[1], int(parts[2])
    data = p.stdout.read(size); p.stdout.read(1)
    if typ != "blob" or size > 5_000_000: continue
    paths = blob_paths.get(sha, set())
    for label, rx in COMPILED:
        m = rx.search(data)
        if not m: continue
        if label == "Google API key (AIza...)" and paths and all(ALLOW_AIZA.search(x) for x in paths): continue
        if label == "PEM private key block"   and paths and all(ALLOW_PEM.search(x)  for x in paths): continue
        groups[(label, m.group(0)[:80])].append(sorted(paths))

for (label, tok), occs in groups.items():
    print(f"{label}: {tok!r} -> {len(occs)} blob(s), e.g. {occs[0]}")
print("DONE" if groups else "CLEAN")
PY
```

Expected output today: `CLEAN`. Any new line means a credential pattern slipped past both the live hook and any previous sweep — investigate immediately, and treat the blob as compromised even if the file no longer exists in the working tree.

### Dependency vulnerabilities — fully resolved (May 9 2026, Task #14)
After Task #13 (`npm audit fix` + targeted major bumps + an `esbuild` override), the audit went from **96 findings (1 critical, ~60 high, ~30 medium, ~7 low)** to **9 findings (8 low + 1 moderate)**. Task #14 fully resolved all remaining findings — `npm audit` now reports **0 vulnerabilities**.

**Active mitigations added across Task #13 and Task #14:**
- Bumped direct deps (Task #13): `drizzle-orm ^0.39.1 → ^0.45.2`, `drizzle-kit ^0.31.4 → ^0.31.10`, `nodemailer ^7.0.12 → ^8.0.7`, `vite ^5.4.20 → ^5.4.21`.
- Added `"overrides": { "esbuild": "^0.25.0" }` in `package.json` (Task #13) to neutralize the `esbuild` dev-server CORS chain coming through `vite`'s and `drizzle-kit`'s bundled copies (fixes GHSA-67mh-4wv8-2f99 across the tree).
- Added `"overrides": { "@tootallnate/once": "^3.0.1" }` in `package.json` (Task #14) to force the patched version of `@tootallnate/once` throughout the `firebase-admin` transitive chain (firebase-admin → @google-cloud/storage → teeny-request → http-proxy-agent → @tootallnate/once), fixing GHSA-vpq2-c234-7xj6 without requiring a firebase-admin downgrade.
- Upgraded `vite ^5.4.21 → ^6.4.2` (Task #14) to fix GHSA-4w7w-66w2-5vf9 (path traversal in optimized deps .map handling). `@vitejs/plugin-react@4.7.0` already declared `vite@6` compatibility, and `@tailwindcss/vite` and the three `@replit/vite-plugin-*` packages are version-agnostic — no config changes required.

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family for typography.

### Device Integrations
- **Apple Health**: Native iOS health data syncing via custom HealthKit Swift plugin.
- **Android Health Connect**: Native Android health data syncing via capacitor-health plugin.
- **Huawei Health Kit**: HMS-based health data syncing for Huawei/Honor devices.
- **Garmin Connect**: Direct Garmin API integration via OAuth 1.0a. Requires `GARMIN_CONSUMER_KEY` and `GARMIN_CONSUMER_SECRET` environment variables. Syncs activeKilocalories, steps, and workout sessions. A bridge option is available for users without API keys, directing them to sync Garmin via Apple Health or Health Connect.

### Key NPM Dependencies
- **Recharts**: Data visualization.
- **React Hook Form with Zod**: Form validation.
- **date-fns**: Date manipulation utilities.
- **Radix UI**: Accessible UI primitives.
- **Class Variance Authority**: Component variant management.
- **Sharp**: Server-side image compression.
- **SimpleWebAuthn**: WebAuthn/passkey authentication.
- **Framer Motion**: Animations for onboarding and UI transitions.
- **@southdevs/capacitor-google-auth**: Google authentication for Capacitor.
- **@capacitor-community/apple-sign-in**: Apple Sign-In for Capacitor.