const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capgo',
  'capacitor-health',
  'android',
  'src',
  'main',
  'java',
  'app',
  'capgo',
  'plugin',
  'health'
);

function patchHealthDataType() {
  const filePath = path.join(PLUGIN_DIR, 'HealthDataType.kt');
  if (!fs.existsSync(filePath)) {
    console.log('[patch] HealthDataType.kt not found, skipping');
    return false;
  }

  const patched = `package app.capgo.plugin.health

import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BasalMetabolicRateRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import kotlin.reflect.KClass

enum class HealthDataType(
    val identifier: String,
    val recordClass: KClass<out Record>,
    val unit: String
) {
    STEPS("steps", StepsRecord::class, "count"),
    DISTANCE("distance", DistanceRecord::class, "meter"),
    CALORIES("calories", TotalCaloriesBurnedRecord::class, "kilocalorie"),
    ACTIVE_CALORIES("active-calories", ActiveCaloriesBurnedRecord::class, "kilocalorie"),
    EXERCISE("exercise", ExerciseSessionRecord::class, "minute"),
    BMR("bmr", BasalMetabolicRateRecord::class, "kilocalorie"),
    HEART_RATE("heartRate", HeartRateRecord::class, "bpm"),
    WEIGHT("weight", WeightRecord::class, "kilogram"),
    SLEEP("sleep", SleepSessionRecord::class, "minute"),
    RESPIRATORY_RATE("respiratoryRate", RespiratoryRateRecord::class, "bpm"),
    OXYGEN_SATURATION("oxygenSaturation", OxygenSaturationRecord::class, "percent"),
    RESTING_HEART_RATE("restingHeartRate", RestingHeartRateRecord::class, "bpm"),
    HEART_RATE_VARIABILITY("heartRateVariability", HeartRateVariabilityRmssdRecord::class, "millisecond");

    val readPermission: String
        get() = HealthPermission.getReadPermission(recordClass)

    val writePermission: String
        get() = HealthPermission.getWritePermission(recordClass)

    companion object {
        fun from(identifier: String): HealthDataType? {
            return entries.firstOrNull { it.identifier == identifier }
        }
    }
}
`;

  fs.writeFileSync(filePath, patched, 'utf8');
  console.log('[patch] HealthDataType.kt patched successfully');
  return true;
}

function patchHealthManager() {
  const filePath = path.join(PLUGIN_DIR, 'HealthManager.kt');
  if (!fs.existsSync(filePath)) {
    console.log('[patch] HealthManager.kt not found, skipping');
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  const importsNeeded = [
    'import androidx.health.connect.client.records.TotalCaloriesBurnedRecord',
    'import androidx.health.connect.client.records.BasalMetabolicRateRecord',
  ];
  for (const imp of importsNeeded) {
    if (!content.includes(imp)) {
      content = content.replace(
        'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord',
        'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord\n' + imp
      );
    }
  }
  if (!content.includes('import androidx.health.connect.client.records.ExerciseSessionRecord')) {
    content = content.replace(
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord',
      'import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord\nimport androidx.health.connect.client.records.ExerciseSessionRecord'
    );
  }

  content = content.replace(
    /HealthDataType\.CALORIES\s*->\s*readRecords\(client,\s*ActiveCaloriesBurnedRecord::class/g,
    'HealthDataType.CALORIES -> readRecords(client, TotalCaloriesBurnedRecord::class'
  );
  content = content.replace(
    /record\.energy\.inKilocalories,\s*\n(\s*)record\.metadata\s*\n(\s*)\)\s*\n(\s*)samples\.add\(record\.startTime to payload\)\s*\n(\s*)\}\s*\n(\s*)HealthDataType\.WEIGHT/,
    `record.energy.inKilocalories,
$1record.metadata
$2)
$3samples.add(record.startTime to payload)
$4}
$5HealthDataType.ACTIVE_CALORIES -> readRecords(client, ActiveCaloriesBurnedRecord::class, startTime, endTime, limit) { record ->
$5    val payload = createSamplePayload(
$5        dataType,
$5        record.startTime,
$5        record.endTime,
$5        record.energy.inKilocalories,
$5        record.metadata
$5    )
$5    samples.add(record.startTime to payload)
$5}
$5HealthDataType.EXERCISE -> readRecords(client, ExerciseSessionRecord::class, startTime, endTime, limit) { record ->
$5    val durationMinutes = Duration.between(record.startTime, record.endTime).toMinutes().toDouble()
$5    val payload = createSamplePayload(
$5        dataType,
$5        record.startTime,
$5        record.endTime,
$5        durationMinutes,
$5        record.metadata
$5    )
$5    samples.add(record.startTime to payload)
$5}
$5HealthDataType.BMR -> readRecords(client, BasalMetabolicRateRecord::class, startTime, endTime, limit) { record ->
$5    val payload = createSamplePayload(
$5        dataType,
$5        record.time,
$5        record.time,
$5        record.basalMetabolicRate.inKilocaloriesPerDay,
$5        record.metadata
$5    )
$5    samples.add(record.time to payload)
$5}
$5HealthDataType.WEIGHT`
  );

  content = content.replace(
    /HealthDataType\.CALORIES\s*->\s*\{\s*\n\s*val record = ActiveCaloriesBurnedRecord\(/g,
    'HealthDataType.CALORIES -> {\n                val record = TotalCaloriesBurnedRecord('
  );

  const saveCaloriesEndPattern = /(\s*)(HealthDataType\.CALORIES\s*->\s*\{[\s\S]*?client\.insertRecords\(listOf\(record\)\)\s*\n\s*\})/;
  const saveCaloriesMatch = content.match(saveCaloriesEndPattern);
  if (saveCaloriesMatch) {
    const indent = saveCaloriesMatch[1];
    const afterCalories = saveCaloriesMatch[0];

    const activeCaloriesSave = `${indent}HealthDataType.ACTIVE_CALORIES -> {
${indent}    val record = ActiveCaloriesBurnedRecord(
${indent}        startTime = startTime,
${indent}        startZoneOffset = zoneOffset(startTime),
${indent}        endTime = endTime,
${indent}        endZoneOffset = zoneOffset(endTime),
${indent}        energy = Energy.kilocalories(value)
${indent}    )
${indent}    client.insertRecords(listOf(record))
${indent}}`;

    const exerciseSave = `${indent}HealthDataType.EXERCISE -> {
${indent}    val record = ExerciseSessionRecord(
${indent}        startTime = startTime,
${indent}        startZoneOffset = zoneOffset(startTime),
${indent}        endTime = endTime,
${indent}        endZoneOffset = zoneOffset(endTime),
${indent}        exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_OTHER_WORKOUT
${indent}    )
${indent}    client.insertRecords(listOf(record))
${indent}}`;

    const bmrSave = `${indent}HealthDataType.BMR -> {
${indent}    val record = BasalMetabolicRateRecord(
${indent}        time = startTime,
${indent}        zoneOffset = zoneOffset(startTime),
${indent}        basalMetabolicRate = Power.kilocaloriesPerDay(value)
${indent}    )
${indent}    client.insertRecords(listOf(record))
${indent}}`;

    content = content.replace(
      afterCalories,
      afterCalories + '\n' + activeCaloriesSave + '\n' + exerciseSave + '\n' + bmrSave
    );
  }

  content = content.replace(
    /HealthDataType\.CALORIES\s*->\s*setOf\(ActiveCaloriesBurnedRecord\.ACTIVE_CALORIES_TOTAL\)/g,
    'HealthDataType.CALORIES -> setOf(TotalCaloriesBurnedRecord.ENERGY_TOTAL)'
  );

  content = content.replace(
    /result\[ActiveCaloriesBurnedRecord\.ACTIVE_CALORIES_TOTAL\]\?\.inKilocalories/g,
    'result[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories'
  );

  const aggregationElsePattern = /else\s*->\s*throw\s*IllegalArgumentException\("Unsupported data type for aggregation: \$\{dataType\.identifier\}"\)/;
  if (aggregationElsePattern.test(content)) {
    content = content.replace(
      aggregationElsePattern,
      `HealthDataType.ACTIVE_CALORIES -> setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
                    else -> throw IllegalArgumentException("Unsupported data type for aggregation: \${dataType.identifier}")`
    );
  }

  const aggregationValueElsePattern = /(\s*)else\s*->\s*null\s*\n(\s*)\}/;
  const aggValueMatch = content.match(aggregationValueElsePattern);
  if (aggValueMatch) {
    const indent = aggValueMatch[1];
    content = content.replace(
      aggregationValueElsePattern,
      `${indent}HealthDataType.ACTIVE_CALORIES -> when (aggregation) {
${indent}    "sum" -> result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories
${indent}    else -> result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories
${indent}}
${indent}else -> null
$2}`
    );
  }

  const sleepAggCheck = content.match(/if\s*\(dataType\s*==\s*HealthDataType\.SLEEP\)/);
  if (sleepAggCheck) {
    content = content.replace(
      /if\s*\(dataType\s*==\s*HealthDataType\.SLEEP\)\s*\{/,
      'if (dataType == HealthDataType.SLEEP || dataType == HealthDataType.EXERCISE || dataType == HealthDataType.BMR) {'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');

  const requiredPatterns = [
    { pattern: 'TotalCaloriesBurnedRecord::class', desc: 'CALORIES -> TotalCaloriesBurnedRecord read' },
    { pattern: 'HealthDataType.ACTIVE_CALORIES ->', desc: 'ACTIVE_CALORIES read/write block' },
    { pattern: 'HealthDataType.EXERCISE ->', desc: 'EXERCISE read/write block' },
    { pattern: 'HealthDataType.BMR ->', desc: 'BMR read/write block' },
    { pattern: 'TotalCaloriesBurnedRecord.ENERGY_TOTAL', desc: 'CALORIES aggregation fix' },
    { pattern: 'BasalMetabolicRateRecord', desc: 'BMR import' },
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

  console.log('[patch] HealthManager.kt patched and validated successfully');
  return true;
}

function main() {
  console.log('[patch] Patching @capgo/capacitor-health Android plugin...');

  if (!fs.existsSync(PLUGIN_DIR)) {
    console.log('[patch] Plugin directory not found, skipping patch');
    console.log('[patch] Expected:', PLUGIN_DIR);
    return;
  }

  const dt = patchHealthDataType();
  const hm = patchHealthManager();

  if (dt || hm) {
    console.log('[patch] Health plugin patch complete!');
    console.log('[patch] Changes:');
    console.log('[patch]   - CALORIES now maps to TotalCaloriesBurnedRecord');
    console.log('[patch]   - Added ACTIVE_CALORIES (ActiveCaloriesBurnedRecord)');
    console.log('[patch]   - Added EXERCISE (ExerciseSessionRecord, duration in minutes)');
    console.log('[patch]   - Added BMR (BasalMetabolicRateRecord, kcal/day)');
  } else {
    console.log('[patch] No files were patched');
  }
}

main();
