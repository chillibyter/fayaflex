import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        print("🔌 Registering HealthKitPlugin")
        bridge?.registerPluginInstance(HealthKitPlugin())
        super.capacitorDidLoad()
    }
}
