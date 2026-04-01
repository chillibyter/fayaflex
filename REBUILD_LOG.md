# iOS Rebuild Log

Changes that require an Xcode rebuild + App Store submission to take effect.

---

## Pending (not yet in App Store)

### 1. Custom URL scheme — `fayaflex://`
- **File:** `ios/App/App/Info.plist`
- **What it does:** Registers `fayaflex://` as a URL scheme so the app can be opened by tapping a `fayaflex://join/CODE` link from anywhere on the device (Messages, Mail, etc.)
- **Note:** The web join page no longer attempts to open the custom scheme directly (it caused a "Safari cannot open" error before the rebuild). Universal Links (item 2 below) handle the "open in app" flow instead — when a user with the app taps the invite URL in Messages or Mail, iOS opens the app directly and never shows the web page at all.

### 2. Associated Domains entitlement (Universal Links)
- **File:** `ios/App/App/App.entitlements`
- **What it does:** Adds `applinks:fayaflex.com` so iOS treats `https://fayaflex.com/join/*` links as Universal Links — tapping a join link in Messages or Mail opens the app directly, bypassing Safari entirely
- **Prerequisite before rebuilding:** Replace `YOURTEAMID` in `server/routes.ts` (line ~52) with the real 10-character Apple Developer Team ID from App Store Connect → Account → Membership. E.g. `AB1CD2EF3G.com.fayaflex.app`

---

## Completed (already live in App Store)

_(nothing yet)_
