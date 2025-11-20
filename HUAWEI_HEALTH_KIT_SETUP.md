# Huawei Health Kit Integration Guide

## Overview
This guide explains how to integrate Huawei Health Kit (HMS Health) into the UFC app to enable automatic fitness data syncing on Huawei and Honor devices.

---

## Current Implementation Status

✅ **Backend Support**: Backend API fully supports `huawei_health` provider  
✅ **Frontend Detection**: App automatically detects Huawei devices  
⚠️ **SDK Integration**: Requires HMS Health Kit SDK setup (in progress)

---

## Prerequisites

### 1. Huawei Developer Account
- Sign up at: https://developer.huawei.com
- Complete account verification (1-2 business days)
- Sign the Huawei Developer Service Agreement

### 2. AppGallery Connect Setup
- Create app in AppGallery Connect console
- Enable **Health Kit** API in console
- Apply for Health Kit permissions
- Download `agconnect-services.json` configuration file

### 3. Development Environment
- **Android Studio**: 3.6.1 or later
- **Java SDK**: 1.8 or later
- **Min SDK**: API level 24 (Android 7.0) or later
- **HMS Core**: Version 4.0.2.300+ on device
- **Huawei Health App**: Version 11.0.0.512 or later

---

## Integration Options

### Option 1: Cordova HMS Plugin (Recommended for Quick Start)
Use the official HMS Health Kit Cordova plugin via Capacitor's Cordova compatibility:

```bash
# Install HMS Health Kit Cordova plugin
npm install @hmscore/cordova-plugin-hms-health

# Sync with Capacitor
npx cap sync android
```

**Pros:**
- Official Huawei support
- Quick setup
- Well-documented

**Cons:**
- Requires Cordova compatibility layer
- Limited to Cordova API surface

### Option 2: Custom Capacitor Plugin (Recommended for Full Control)
Build a custom Capacitor plugin wrapping HMS Health Kit native Android SDK:

```bash
# Create plugin directory
mkdir -p plugins/capacitor-hms-health

# Initialize plugin
npm init @capacitor/plugin

# Add HMS dependencies to plugin's build.gradle
```

**Pros:**
- Native Capacitor integration
- Full control over API
- Better TypeScript support

**Cons:**
- Requires more development effort
- Manual maintenance

---

## Setup Steps

### Step 1: Configure AppGallery Connect

1. **Enable Health Kit:**
   - Go to AppGallery Connect console
   - Navigate to **My apps > Your App > Manage APIs**
   - Enable **Health Kit**
   - Click **Apply for Health Kit**

2. **Select Data Types:**
   - Steps
   - Active calories
   - Workouts/activities
   - Heart rate (optional)
   - Sleep (optional)

3. **Download Configuration:**
   - Go to **Project settings > General**
   - Download **agconnect-services.json**
   - Place in `android/app/` directory

### Step 2: Add HMS Dependencies

Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.huawei.agconnect'

dependencies {
    // HMS Health Kit SDK
    implementation 'com.huawei.hms:health:6.11.0.300'
    
    // HMS Core
    implementation 'com.huawei.agconnect:agconnect-core:1.9.1.301'
    implementation 'com.huawei.hms:hwid:6.11.0.300'
}
```

Update `android/build.gradle`:

```gradle
buildscript {
    repositories {
        maven { url 'https://developer.huawei.com/repo/' }
    }
    dependencies {
        classpath 'com.huawei.agconnect:agcp:1.4.1.300'
    }
}

allprojects {
    repositories {
        maven { url 'https://developer.huawei.com/repo/' }
    }
}
```

### Step 3: Update AndroidManifest.xml

Add app ID and permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <!-- Huawei App ID -->
    <meta-data
        android:name="com.huawei.hms.client.appid"
        android:value="appid=YOUR_APP_ID_HERE" />
</application>

<!-- Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android:permission.ACCESS_FINE_LOCATION" />
```

### Step 4: Generate Signing Certificate

1. Generate SHA-256 certificate fingerprint
2. Add to AppGallery Connect under **Project settings > General**
3. Follow: [Signing fingerprint guide](https://developer.huawei.com/consumer/en/doc/development/HMSCore-Guides-V5/signing-fingerprint-0000001059050363-V5)

---

## Implementation Approach

### Frontend (TypeScript/React)

The health service already supports Huawei device detection:

```typescript
// client/src/lib/healthService.ts
async getProviderName(): Promise<'apple_health' | 'android_health' | 'huawei_health'> {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    return 'apple_health';
  } else if (platform === 'android') {
    const manufacturer = await this.detectManufacturer();
    return manufacturer === 'huawei' ? 'huawei_health' : 'android_health';
  }
  
  return 'android_health';
}
```

### Backend (Node.js/Express)

Backend endpoints already accept `huawei_health`:

```typescript
// server/routes.ts
const syncSchema = z.object({
  provider: z.enum(['apple_health', 'android_health', 'huawei_health']),
  activities: z.array(z.object({
    date: z.string(),
    calories: z.number().int().min(0),
    steps: z.number().int().min(0),
    workoutType: z.string().optional(),
  })).max(100),
});
```

---

## HMS Health Kit Native Implementation

### Authorization Flow

```java
// Example: Request Health Kit permissions
HiHealthOptions options = HiHealthOptions.builder()
    .addDataType(DataType.DT_CONTINUOUS_STEPS_DELTA, HiHealthOptions.ACCESS_READ)
    .addDataType(DataType.DT_CONTINUOUS_STEPS_DELTA, HiHealthOptions.ACCESS_WRITE)
    .addDataType(DataType.DT_CONTINUOUS_CALORIES_BURNT, HiHealthOptions.ACCESS_READ)
    .build();

HuaweiIdAuthParams authParams = new HuaweiIdAuthParams.Builder()
    .setAccessToken()
    .build();

HuaweiIdAuthService authService = HuaweiIdAuthManager.getService(context, authParams);
Intent signInIntent = authService.getSignInIntent();
startActivityForResult(signInIntent, REQUEST_SIGN_IN_LOGIN);
```

### Read Health Data

```java
// Query steps for today
ReadOptions readOptions = new ReadOptions.Builder()
    .read(DataType.DT_CONTINUOUS_STEPS_DELTA)
    .setTimeRange(startTime, endTime, TimeUnit.MILLISECONDS)
    .build();

dataController.read(readOptions)
    .addOnSuccessListener(readResponse -> {
        for (SampleSet sampleSet : readResponse.getSampleSets()) {
            for (SamplePoint sample : sampleSet.getSamplePoints()) {
                int steps = sample.getFieldValue(Field.FIELD_STEPS_DELTA).asIntValue();
                // Send to backend
            }
        }
    });
```

---

## Data Type Mapping

| UFC Data Field | HMS Data Type | Field |
|----------------|---------------|-------|
| Steps | `DT_CONTINUOUS_STEPS_DELTA` | `FIELD_STEPS_DELTA` |
| Calories | `DT_CONTINUOUS_CALORIES_BURNT` | `FIELD_CALORIES` |
| Workouts | `DT_CONTINUOUS_WORKOUT_DURATION` | `FIELD_DURATION` |

---

## Testing

### Test on Huawei Device

1. Install HMS Core from AppGallery
2. Install Huawei Health app
3. Sign in with Huawei ID
4. Grant health permissions
5. Test sync functionality

### Debugging

```java
// Enable Health Kit logging
HiHealthOptions options = HiHealthOptions.builder()
    .setHiHealthOpenAPICheckFlag(HiHealthOpenAPICheckFlag.CHECK_ALL)
    .build();
```

---

## Resources

- **HMS Health Kit Documentation**: https://developer.huawei.com/consumer/en/hms/huaweihealth/
- **Official Java Demo**: https://github.com/HMS-Core/hms-health-demo-java
- **Official Kotlin Demo**: https://github.com/HMS-Core/hms-health-demo-kotlin
- **CodeLab Tutorial**: https://developer.huawei.com/consumer/en/codelab/MyHealth/
- **Data Types Reference**: https://developer.huawei.com/consumer/en/doc/development/HMSCore-References/datatypes-0000001050071667
- **AppGallery Connect**: https://developer.huawei.com/consumer/en/console

---

## Next Steps

1. ✅ Backend supports `huawei_health` provider
2. ✅ Frontend detects Huawei devices
3. ⏳ **TODO**: Implement HMS Health Kit SDK integration
4. ⏳ **TODO**: Create Capacitor plugin or use Cordova bridge
5. ⏳ **TODO**: Test on Huawei devices
6. ⏳ **TODO**: Submit app to AppGallery for Health Kit review

---

## Notes

- **Device Compatibility**: Only works on Huawei/Honor devices with HMS Core
- **User Requirements**: Users must have Huawei ID and Huawei Health app installed
- **Permissions**: Users must grant health data access permissions
- **Data Privacy**: All health data stays on device until user initiates sync
- **Approval**: AppGallery review required for Health Kit access

---

## Support

For issues or questions:
- Huawei Developer Forum: https://forums.developer.huawei.com/
- Stack Overflow tag: `huawei-mobile-services`
- HMS Core GitHub Issues: https://github.com/HMS-Core/hms-health-demo-java/issues
