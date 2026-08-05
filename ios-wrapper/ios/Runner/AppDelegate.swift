import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(
        name: "gleame/sf_symbols",
        binaryMessenger: controller.binaryMessenger
      )
      channel.setMethodCallHandler { call, result in
        guard call.method == "render",
              let args = call.arguments as? [String: Any],
              let name = args["name"] as? String else {
          result(FlutterMethodNotImplemented)
          return
        }

        let pointSize = args["pointSize"] as? CGFloat ?? 34
        let weightName = args["weight"] as? String ?? "semibold"
        let weight: UIImage.SymbolWeight = {
          switch weightName {
          case "regular": return .regular
          case "medium": return .medium
          case "bold": return .bold
          case "heavy": return .heavy
          default: return .semibold
          }
        }()
        let configuration = UIImage.SymbolConfiguration(pointSize: pointSize, weight: weight)
        guard let symbol = UIImage(systemName: name, withConfiguration: configuration) else {
          result(nil)
          return
        }

        let tinted = symbol.withTintColor(.black, renderingMode: .alwaysOriginal)
        let format = UIGraphicsImageRendererFormat()
        format.scale = UIScreen.main.scale
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: tinted.size, format: format)
        let image = renderer.image { _ in
          tinted.draw(in: CGRect(origin: .zero, size: tinted.size))
        }
        result(image.pngData())
      }
    }
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
