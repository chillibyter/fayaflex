import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
    
    private var healthKitPlugin: HealthKitPlugin?
    
    override open func capacitorDidLoad() {
        // IMPORTANT: Register plugin BEFORE calling super
        // super.capacitorDidLoad() triggers JS bridge initialization
        healthKitPlugin = HealthKitPlugin()
        if let plugin = healthKitPlugin {
            bridge?.registerPluginInstance(plugin)
            print("HealthKitPlugin: Successfully registered before JS init")
        } else {
            print("HealthKitPlugin: Failed to create instance")
        }
        
        // Now let JS initialize - plugin will be available
        super.capacitorDidLoad()
    }
}
