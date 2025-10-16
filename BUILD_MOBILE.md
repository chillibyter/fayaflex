# Quick Mobile Build Guide

## Prerequisites Installed ✅
- Capacitor Core, CLI, iOS, and Android platforms
- Camera, Splash Screen, Status Bar, and App plugins
- Native projects created in `ios/` and `android/` folders

## Quick Start Commands

### 1. Build the Web App
```bash
npm run build
```

### 2. Sync Changes to Native Projects
```bash
npx cap sync
```

### 3. Open in Native IDEs

**For iOS (requires Mac with Xcode):**
```bash
npx cap open ios
```

**For Android (requires Android Studio):**
```bash
npx cap open android
```

## Current Status

✅ Capacitor configured
✅ iOS project generated  
✅ Android project generated
✅ Native plugins installed:
   - Camera (for photo evidence)
   - Splash Screen
   - Status Bar
   - App lifecycle

## Next Steps

1. **Prepare App Icons**
   - iOS: 1024x1024px for App Store
   - Android: 512x512px for Play Store
   - Use icon generator tools or design tools

2. **Test on Real Devices**
   ```bash
   # iOS (connected iPhone via USB)
   npx cap run ios --target=<device-id>
   
   # Android (connected Android via USB, enable USB debugging)
   npx cap run android --target=<device-id>
   ```

3. **Configure for Production**
   - Update `capacitor.config.ts` with production server URL
   - Set proper bundle identifiers
   - Add required permissions in native projects

4. **Follow Full Deployment Guide**
   - See `APP_STORE_GUIDE.md` for complete submission instructions
   - Apple App Store requires Mac + Xcode + $99/year developer account
   - Google Play Store requires Android Studio + $25 one-time fee

## Important Files

- `capacitor.config.ts` - Capacitor configuration
- `ios/` - iOS native project (open with Xcode)
- `android/` - Android native project (open with Android Studio)
- `dist/public/` - Built web assets (auto-synced to native apps)

## Development Workflow

When you make changes to your web app:
1. Make changes to React code
2. Run `npm run build`
3. Run `npx cap sync`
4. Rebuild in Xcode/Android Studio

## Production Checklist

Before submitting to stores:
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Update version numbers
- [ ] Create app icons (all required sizes)
- [ ] Add screenshots for stores
- [ ] Write app description
- [ ] Set up privacy policy URL
- [ ] Configure app signing (both platforms)
- [ ] Test in-app camera functionality
- [ ] Verify API calls work with production backend

## Useful Commands

```bash
# Update Capacitor and plugins
npx cap update

# Check Capacitor environment
npx cap doctor

# Copy web assets only
npx cap copy

# List connected devices
npx cap run ios --list
npx cap run android --list
```

## Platform-Specific Notes

### iOS
- Requires macOS with Xcode
- Need Apple Developer Account ($99/year) to publish
- Can test on simulator without account
- Real device testing requires (free) developer account

### Android
- Works on Mac, Windows, or Linux
- Need Google Play Console account ($25 one-time) to publish
- Can test on emulator or real device for free
- USB debugging must be enabled on device

## Getting Help

- Capacitor Docs: https://capacitorjs.com/docs
- iOS Guide: https://capacitorjs.com/docs/ios
- Android Guide: https://capacitorjs.com/docs/android
