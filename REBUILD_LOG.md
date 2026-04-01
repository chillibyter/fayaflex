# iOS Rebuild Log

Changes that require an Xcode rebuild + App Store submission to take effect.

---

## Pending (not yet in App Store)

### 1. Custom URL scheme — `fayaflex://`
- **File:** `ios/App/App/Info.plist`
- **What it does:** Registers `fayaflex://` as a URL scheme so the app can be opened by tapping a `fayaflex://join/CODE` link from anywhere on the device (Safari, Messages, etc.)
- **User-facing effect:** The "Open in FayaFlex App" button on the invite join page will open the app directly to the join screen instead of falling back to the App Store

### 2. Associated Domains entitlement (Universal Links)
- **File:** `ios/App/App/App.entitlements`
- **What it does:** Adds `applinks:fayaflex.com` so iOS treats `https://fayaflex.com/join/*` links as Universal Links — tapping a join link in Messages or Mail opens the app directly, bypassing Safari entirely
- **Prerequisite before rebuilding:** Replace `YOURTEAMID` in `server/routes.ts` (line ~52) with the real 10-character Apple Developer Team ID from App Store Connect → Account → Membership. E.g. `AB1CD2EF3G.com.fayaflex.app`

---

## Completed (already live in App Store)

_(nothing yet)_
