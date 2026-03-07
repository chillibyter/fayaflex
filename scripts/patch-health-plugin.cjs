const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  'capacitor-health',
  'android',
  'src',
  'main',
  'java',
  'com',
  'fit_up',
  'health',
  'capacitor'
);

function patchHealthPlugin() {
  const filePath = path.join(PLUGIN_DIR, 'HealthPlugin.kt');
  if (!fs.existsSync(filePath)) {
    console.log('[patch] HealthPlugin.kt not found, skipping');
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!content.includes('import androidx.health.connect.client.records.BasalMetabolicRateRecord')) {
    content = content.replace(
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord',
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord\nimport androidx.health.connect.client.records.BasalMetabolicRateRecord'
    );
    changed = true;
    console.log('[patch]   + Added BasalMetabolicRateRecord import');
  }

  if (!content.includes('import androidx.health.connect.client.records.TotalCaloriesBurnedRecord')) {
    content = content.replace(
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord',
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord\nimport androidx.health.connect.client.records.TotalCaloriesBurnedRecord'
    );
    changed = true;
    console.log('[patch]   + Added TotalCaloriesBurnedRecord import');
  }

  if (!content.includes('import androidx.health.connect.client.units.Power')) {
    content = content.replace(
      'import androidx.health.connect.client.time.TimeRangeFilter',
      'import androidx.health.connect.client.time.TimeRangeFilter\nimport androidx.health.connect.client.units.Power'
    );
    changed = true;
    console.log('[patch]   + Added Power import');
  }

  if (!content.includes('READ_BMR')) {
    content = content.replace(
      'READ_STEPS, READ_WORKOUTS, READ_HEART_RATE, READ_ROUTE, READ_ACTIVE_CALORIES, READ_TOTAL_CALORIES, READ_DISTANCE;',
      'READ_STEPS, READ_WORKOUTS, READ_HEART_RATE, READ_ROUTE, READ_ACTIVE_CALORIES, READ_TOTAL_CALORIES, READ_DISTANCE, READ_BMR;'
    );
    changed = true;
    console.log('[patch]   + Added READ_BMR to CapHealthPermission enum');
  }

  if (!content.includes('alias = "READ_BMR"')) {
    content = content.replace(
      `Permission(
            alias = "READ_ROUTE",
            strings = ["android.permission.health.READ_EXERCISE_ROUTE"]
        )
    ]`,
      `Permission(
            alias = "READ_ROUTE",
            strings = ["android.permission.health.READ_EXERCISE_ROUTE"]
        ),
        Permission(
            alias = "READ_BMR",
            strings = ["android.permission.health.READ_BASAL_METABOLIC_RATE"]
        )
    ]`
    );
    changed = true;
    console.log('[patch]   + Added READ_BMR permission annotation');
  }

  if (!content.includes('CapHealthPermission.READ_BMR')) {
    content = content.replace(
      'Pair(CapHealthPermission.READ_STEPS, "android.permission.health.READ_STEPS")',
      'Pair(CapHealthPermission.READ_STEPS, "android.permission.health.READ_STEPS"),\n        Pair(CapHealthPermission.READ_BMR, "android.permission.health.READ_BASAL_METABOLIC_RATE")'
    );
    changed = true;
    console.log('[patch]   + Added READ_BMR to permissionMapping');
  }

  if (!content.includes('"total-calories"')) {
    content = content.replace(
      `"active-calories" -> metricAndMapper("active-calories", CapHealthPermission.READ_ACTIVE_CALORIES, ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL) { it?.inKilocalories }`,
      `"active-calories" -> metricAndMapper("active-calories", CapHealthPermission.READ_ACTIVE_CALORIES, ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL) { it?.inKilocalories }
            "total-calories" -> metricAndMapper("total-calories", CapHealthPermission.READ_TOTAL_CALORIES, TotalCaloriesBurnedRecord.ENERGY_TOTAL) { it?.inKilocalories }`
    );
    changed = true;
    console.log('[patch]   + Added "total-calories" data type mapped to TotalCaloriesBurnedRecord');
  }

  if (!content.includes('"bmr"')) {
    content = content.replace(
      `"distance" -> metricAndMapper("distance", CapHealthPermission.READ_DISTANCE, DistanceRecord.DISTANCE_TOTAL) { it?.inMeters }
            else -> throw RuntimeException("Unsupported dataType: $dataType")`,
      `"distance" -> metricAndMapper("distance", CapHealthPermission.READ_DISTANCE, DistanceRecord.DISTANCE_TOTAL) { it?.inMeters }
            "bmr" -> metricAndMapper("bmr", CapHealthPermission.READ_BMR, BasalMetabolicRateRecord.BASAL_CALORIES_TOTAL) { it?.inKilocalories }
            else -> throw RuntimeException("Unsupported dataType: $dataType")`
    );
    changed = true;
    console.log('[patch]   + Added "bmr" data type to getMetricAndMapper');
  }

  if (!content.includes('queryBmr')) {
    const queryBmrMethod = `

    @PluginMethod
    fun queryBmr(call: PluginCall) {
        val startDate = call.getString("startDate")
        val endDate = call.getString("endDate")
        if (startDate == null || endDate == null) {
            call.reject("Missing required parameters: startDate or endDate")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (!hasPermission(CapHealthPermission.READ_BMR)) {
                    call.reject("BMR permission not granted")
                    return@launch
                }

                val startInstant = Instant.parse(startDate)
                val endInstant = Instant.parse(endDate)
                val timeRange = TimeRangeFilter.between(
                    startInstant.atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    endInstant.atZone(ZoneId.systemDefault()).toLocalDateTime()
                )
                val request = ReadRecordsRequest(BasalMetabolicRateRecord::class, timeRange)
                val response = healthConnectClient.readRecords(request)

                val bmrArray = JSArray()
                for (record in response.records) {
                    val bmrObject = JSObject()
                    bmrObject.put("time", record.time.toString())
                    bmrObject.put("value", record.basalMetabolicRate.inKilocaloriesPerDay)
                    bmrObject.put("sourceBundleId", record.metadata.dataOrigin.packageName)
                    bmrArray.put(bmrObject)
                }

                val result = JSObject()
                result.put("records", bmrArray)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Error querying BMR: \${e.message}")
            }
        }
    }`;

    content = content.replace(
      '    private val exerciseTypeMapping = mapOf(',
      queryBmrMethod + '\n\n    private val exerciseTypeMapping = mapOf('
    );
    changed = true;
    console.log('[patch]   + Added queryBmr method');
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');

    const requiredPatterns = [
      { pattern: 'BasalMetabolicRateRecord', desc: 'BMR import' },
      { pattern: 'TotalCaloriesBurnedRecord', desc: 'TotalCaloriesBurnedRecord import' },
      { pattern: 'READ_BMR', desc: 'READ_BMR permission enum' },
      { pattern: 'READ_BASAL_METABOLIC_RATE', desc: 'BMR Android permission' },
      { pattern: '"bmr"', desc: 'BMR data type in getMetricAndMapper' },
      { pattern: '"total-calories"', desc: 'total-calories data type in getMetricAndMapper' },
      { pattern: 'ENERGY_TOTAL', desc: 'TotalCaloriesBurnedRecord.ENERGY_TOTAL mapping' },
      { pattern: 'queryBmr', desc: 'queryBmr method' },
    ];

    let allOk = true;
    for (const { pattern, desc } of requiredPatterns) {
      if (!content.includes(pattern)) {
        console.error(`[patch] VALIDATION FAILED: Missing "${desc}" (pattern: ${pattern})`);
        allOk = false;
      }
    }

    if (!allOk) {
      console.error('[patch] WARNING: Some patches may not have applied correctly!');
      console.error('[patch] The plugin source may have changed. Please review manually.');
      return false;
    }

    console.log('[patch] HealthPlugin.kt patched and validated successfully');
    return true;
  } else {
    console.log('[patch] HealthPlugin.kt already patched, no changes needed');
    return true;
  }
}

function main() {
  console.log('[patch] Patching capacitor-health Android plugin...');

  if (!fs.existsSync(PLUGIN_DIR)) {
    console.log('[patch] Plugin directory not found, skipping patch');
    console.log('[patch] Expected:', PLUGIN_DIR);
    return;
  }

  const result = patchHealthPlugin();

  if (result) {
    console.log('[patch] Health plugin patch complete!');
    console.log('[patch] Changes:');
    console.log('[patch]   - Added TotalCaloriesBurnedRecord import and "total-calories" aggregated data type');
    console.log('[patch]   - Added BMR (BasalMetabolicRateRecord) support');
    console.log('[patch]   - Added READ_BMR permission');
    console.log('[patch]   - Added queryBmr method for reading BMR records');
    console.log('[patch]   - Added "bmr" as aggregatable data type');
  }
}

main();
