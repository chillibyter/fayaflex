import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
    
    override open func capacitorDidLoad() {
        // Register plugin BEFORE calling super (which triggers JS init)
        bridge?.registerPluginInstance(HealthKitPlugin())
        print("HealthKitPlugin: Registered in capacitorDidLoad")
        super.capacitorDidLoad()
    }
}
