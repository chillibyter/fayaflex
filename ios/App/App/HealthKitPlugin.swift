import Foundation
import Capacitor
import HealthKit
import CoreLocation

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDailyTotals", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getWorkouts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getHealthData", returnType: CAPPluginReturnPromise)
    ]
    
    private let healthStore = HKHealthStore()

    static func workoutActivityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "running"
        case .walking: return "walking"
        case .cycling: return "cycling"
        case .swimming: return "swimming"
        case .hiking: return "hiking"
        case .yoga: return "yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "weightlifting"
        case .crossTraining: return "crossfit"
        case .rowing: return "rowing"
        case .elliptical: return "elliptical"
        case .stairClimbing, .stairs, .stepTraining: return "stair climbing"
        case .highIntensityIntervalTraining: return "HIIT"
        case .pilates: return "pilates"
        case .dance, .danceInspiredTraining, .cardioDance, .socialDance: return "dance"
        case .boxing, .kickboxing: return "boxing"
        case .martialArts: return "martial arts"
        case .climbing: return "climbing"
        case .soccer: return "soccer"
        case .basketball: return "basketball"
        case .tennis: return "tennis"
        case .golf: return "golf"
        case .skatingSports: return "skating"
        case .snowSports, .downhillSkiing, .crossCountrySkiing, .snowboarding: return "snow sports"
        case .surfingSports, .paddleSports: return "water sports"
        case .mixedCardio, .mixedMetabolicCardioTraining: return "cardio"
        case .coreTraining: return "core training"
        case .flexibility: return "stretching"
        default: return "workout"
        }
    }
    
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepType)
        }
        if let calorieType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(calorieType)
        }
        if let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) {
            types.insert(hrType)
        }
        if let distType = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) {
            types.insert(distType)
        }
        if let cycDistType = HKObjectType.quantityType(forIdentifier: .distanceCycling) {
            types.insert(cycDistType)
        }
        types.insert(HKObjectType.workoutType())
        // HKSeriesType.workoutRoute() backs the GPS trace for outdoor workouts.
        // Without it, route queries return an empty result and the feed cards
        // fall back to no map, even when the workout was recorded outdoors.
        types.insert(HKSeriesType.workoutRoute())
        return types
    }

    // Encode an array of CLLocations as a Google encoded polyline string.
    // We round to 1e5 (≈1.1m precision) to match the standard polyline
    // algorithm and keep payloads small. Drops invalid/zero coordinates so a
    // single bad GPS sample doesn't poison the trace.
    private func encodePolyline(locations: [CLLocation]) -> String {
        var output = ""
        var prevLat: Int = 0
        var prevLng: Int = 0
        for loc in locations {
            let coord = loc.coordinate
            if !CLLocationCoordinate2DIsValid(coord) { continue }
            if coord.latitude == 0 && coord.longitude == 0 { continue }
            let lat = Int((coord.latitude * 1e5).rounded())
            let lng = Int((coord.longitude * 1e5).rounded())
            output += encodeSignedNumber(lat - prevLat)
            output += encodeSignedNumber(lng - prevLng)
            prevLat = lat
            prevLng = lng
        }
        return output
    }

    private func encodeSignedNumber(_ num: Int) -> String {
        var sgnNum = num << 1
        if num < 0 { sgnNum = ~sgnNum }
        var out = ""
        while sgnNum >= 0x20 {
            let nextValue = (0x20 | (sgnNum & 0x1f)) + 63
            out.append(Character(UnicodeScalar(nextValue)!))
            sgnNum >>= 5
        }
        let last = sgnNum + 63
        out.append(Character(UnicodeScalar(last)!))
        return out
    }

    // Fetch the GPS trace (HKWorkoutRoute) for one workout and resolve to a
    // Google-encoded polyline string. Returns "" when the workout has no
    // route (indoor workout, location permission denied, or pre-iOS 11 data).
    private func fetchEncodedRoute(for workout: HKWorkout, completion: @escaping (String) -> Void) {
        let routeType = HKSeriesType.workoutRoute()
        let predicate = HKQuery.predicateForObjects(from: workout)
        let routeQuery = HKSampleQuery(
            sampleType: routeType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] _, samples, _ in
            guard let self = self,
                  let routes = samples as? [HKWorkoutRoute],
                  !routes.isEmpty else {
                completion("")
                return
            }

            // A single workout can have multiple HKWorkoutRoute samples (e.g.
            // the OS split the trace across pauses). Concatenate every
            // sample's locations in chronological order before encoding so
            // we don't silently drop later segments of the run.
            let routeLocationsQueue = DispatchQueue(label: "fayaflex.healthkit.routelocs")
            var perRouteLocations: [Int: [CLLocation]] = [:]
            let routeGroup = DispatchGroup()

            for (idx, route) in routes.enumerated() {
                routeGroup.enter()
                var collected: [CLLocation] = []
                let routeLocationQuery = HKWorkoutRouteQuery(route: route) { _, locations, done, _ in
                    if let locs = locations { collected.append(contentsOf: locs) }
                    if done {
                        routeLocationsQueue.sync {
                            perRouteLocations[idx] = collected
                        }
                        routeGroup.leave()
                    }
                }
                self.healthStore.execute(routeLocationQuery)
            }

            routeGroup.notify(queue: .global()) {
                let merged: [CLLocation] = routeLocationsQueue.sync {
                    var all: [CLLocation] = []
                    for i in 0..<routes.count {
                        if let segment = perRouteLocations[i] { all.append(contentsOf: segment) }
                    }
                    return all
                }
                // Downsample very long traces to keep the encoded string
                // bounded (every 3rd point is plenty for a thumbnail).
                let stride = merged.count > 1500 ? 3 : 1
                let sampled = stride == 1
                    ? merged
                    : merged.enumerated().compactMap { idx, loc in idx % stride == 0 ? loc : nil }
                completion(self.encodePolyline(locations: sampled))
            }
        }
        healthStore.execute(routeQuery)
    }
    
    @objc public func isAvailable(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        call.resolve(["available": available])
    }
    
    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false, "error": "HealthKit not available"])
            return
        }
        
        healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.resolve(["granted": false, "error": error.localizedDescription])
                } else {
                    call.resolve(["granted": success])
                }
            }
        }
    }
    
    @objc public func getDailyTotals(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        var steps: Double = 0
        var calories: Double = 0
        let group = DispatchGroup()
        
        if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
                if let sum = result?.sumQuantity() {
                    steps = sum.doubleValue(for: HKUnit.count())
                }
                group.leave()
            }
            healthStore.execute(query)
        }
        
        if let calorieType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            group.enter()
            let query = HKStatisticsQuery(quantityType: calorieType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
                if let sum = result?.sumQuantity() {
                    calories = sum.doubleValue(for: HKUnit.kilocalorie())
                }
                group.leave()
            }
            healthStore.execute(query)
        }
        
        group.notify(queue: .main) {
            call.resolve([
                "steps": Int(steps),
                "calories": Int(calories)
            ])
        }
    }
    
    @objc public func getWorkouts(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }
        
        let limit = call.getInt("limit") ?? 20
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let healthStoreRef = self.healthStore
        let query = HKSampleQuery(
            sampleType: HKObjectType.workoutType(),
            predicate: nil,
            limit: limit,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            if let error = error {
                DispatchQueue.main.async { call.reject(error.localizedDescription) }
                return
            }

            let formatter = ISO8601DateFormatter()
            let workoutSamples = samples as? [HKWorkout] ?? []
            var results: [[String: Any]] = Array(repeating: [:], count: workoutSamples.count)
            // Serial queue used to safely mutate `results` from multiple
            // background HealthKit completion threads. Swift Dictionary is a
            // value type, so we MUST go through results[idx] (not a captured
            // copy of the entry dict) when writing partial fields.
            let resultsQueue = DispatchQueue(label: "fayaflex.healthkit.results")
            let group = DispatchGroup()
            let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate)
            let hrUnit = HKUnit.count().unitDivided(by: HKUnit.minute())

            for (idx, workout) in workoutSamples.enumerated() {
                let energyKcal = workout.totalEnergyBurned?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
                let distanceMeters = workout.totalDistance?.doubleValue(for: HKUnit.meter()) ?? 0
                let elevation = (workout.metadata?[HKMetadataKeyElevationAscended] as? HKQuantity)?.doubleValue(for: HKUnit.meter()) ?? 0

                // Seed the slot with the synchronous fields. Async lookups
                // below merge their fields into results[idx] under the
                // serial queue.
                resultsQueue.sync {
                    results[idx] = [
                        "uuid": workout.uuid.uuidString,
                        "activityType": workout.workoutActivityType.rawValue,
                        "activityTypeName": HealthKitPlugin.workoutActivityName(workout.workoutActivityType),
                        "startDate": formatter.string(from: workout.startDate),
                        "endDate": formatter.string(from: workout.endDate),
                        "duration": workout.duration,
                        "calories": Int(energyKcal),
                        "distanceMeters": Int(distanceMeters),
                        "elevationGainMeters": Int(elevation)
                    ]
                }

                // Route lookup runs in parallel with heart-rate stats. Both
                // completion handlers merge into results[idx] via the
                // serial queue, so partial updates can't clobber each other.
                group.enter()
                self.fetchEncodedRoute(for: workout) { polyline in
                    if !polyline.isEmpty {
                        resultsQueue.sync {
                            results[idx]["routePolyline"] = polyline
                        }
                    }
                    group.leave()
                }

                if let hrType = hrType {
                    group.enter()
                    let predicate = HKQuery.predicateForSamples(withStart: workout.startDate, end: workout.endDate, options: .strictStartDate)
                    let hrQuery = HKStatisticsQuery(quantityType: hrType, quantitySamplePredicate: predicate, options: [.discreteAverage, .discreteMax]) { _, stats, _ in
                        resultsQueue.sync {
                            if let avg = stats?.averageQuantity()?.doubleValue(for: hrUnit) {
                                results[idx]["avgHeartRate"] = Int(avg.rounded())
                            }
                            if let max = stats?.maximumQuantity()?.doubleValue(for: hrUnit) {
                                results[idx]["maxHeartRate"] = Int(max.rounded())
                            }
                        }
                        group.leave()
                    }
                    healthStoreRef.execute(hrQuery)
                }
            }

            group.notify(queue: .main) {
                let snapshot: [[String: Any]] = resultsQueue.sync {
                    return results.filter { !$0.isEmpty }
                }
                call.resolve(["workouts": snapshot])
            }
        }
        
        healthStore.execute(query)
    }
    
    @objc public func getHealthData(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }
        
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate") else {
            call.reject("startDate and endDate are required")
            return
        }
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let startDate = formatter.date(from: startDateStr) ?? ISO8601DateFormatter().date(from: startDateStr),
              let endDate = formatter.date(from: endDateStr) ?? ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date format")
            return
        }
        
        let calendar = Calendar.current
        var interval = DateComponents()
        interval.day = 1
        
        var dailyData: [[String: Any]] = []
        let group = DispatchGroup()
        var stepsPerDay: [String: Double] = [:]
        var caloriesPerDay: [String: Double] = [:]
        var workoutsPerDay: [String: Int] = [:]
        
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "yyyy-MM-dd"
        
        if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let query = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate),
                options: .cumulativeSum,
                anchorDate: calendar.startOfDay(for: startDate),
                intervalComponents: interval
            )
            
            query.initialResultsHandler = { _, results, _ in
                results?.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                    if let sum = statistics.sumQuantity() {
                        let dateKey = dayFormatter.string(from: statistics.startDate)
                        stepsPerDay[dateKey] = sum.doubleValue(for: HKUnit.count())
                    }
                }
                group.leave()
            }
            
            healthStore.execute(query)
        }
        
        if let calorieType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            group.enter()
            let query = HKStatisticsCollectionQuery(
                quantityType: calorieType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate),
                options: .cumulativeSum,
                anchorDate: calendar.startOfDay(for: startDate),
                intervalComponents: interval
            )
            
            query.initialResultsHandler = { _, results, _ in
                results?.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                    if let sum = statistics.sumQuantity() {
                        let dateKey = dayFormatter.string(from: statistics.startDate)
                        caloriesPerDay[dateKey] = sum.doubleValue(for: HKUnit.kilocalorie())
                    }
                }
                group.leave()
            }
            
            healthStore.execute(query)
        }
        
        group.enter()
        let workoutPredicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let workoutQuery = HKSampleQuery(
            sampleType: HKObjectType.workoutType(),
            predicate: workoutPredicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { _, samples, _ in
            for sample in (samples as? [HKWorkout] ?? []) {
                let dateKey = dayFormatter.string(from: sample.startDate)
                workoutsPerDay[dateKey, default: 0] += 1
            }
            group.leave()
        }
        healthStore.execute(workoutQuery)
        
        group.notify(queue: .main) {
            var allDates = Set<String>()
            allDates.formUnion(stepsPerDay.keys)
            allDates.formUnion(caloriesPerDay.keys)
            allDates.formUnion(workoutsPerDay.keys)
            
            for dateKey in allDates.sorted() {
                dailyData.append([
                    "date": dateKey,
                    "steps": Int(stepsPerDay[dateKey] ?? 0),
                    "calories": Int(caloriesPerDay[dateKey] ?? 0),
                    "workouts": workoutsPerDay[dateKey] ?? 0
                ])
            }
            
            call.resolve(["data": dailyData])
        }
    }
}

