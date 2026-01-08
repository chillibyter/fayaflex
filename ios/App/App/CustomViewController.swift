import UIKit
import Capacitor

@objc(CustomViewController)
class CustomViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        print("Registering HealthKitPlugin")
        bridge?.registerPluginInstance(HealthKitPlugin())
        super.capacitorDidLoad()
    }
}
