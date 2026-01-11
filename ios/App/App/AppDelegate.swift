import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    private var bridgeViewController: CAPBridgeViewController?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Build bridge with custom plugins BEFORE JavaScript loads
        // This ensures HealthKitPlugin is registered before JS bridge initializes
        let descriptor = InstanceDescriptor()
        bridgeViewController = CAPBridgeViewController(descriptor: descriptor)
        
        // Register HealthKit plugin before window appears
        if let vc = bridgeViewController {
            vc.bridge?.registerPluginInstance(HealthKitPlugin())
            print("HealthKitPlugin: Registered via AppDelegate")
        }

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
