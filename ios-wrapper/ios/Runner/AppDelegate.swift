import Flutter
import UIKit
import AVFoundation
import MediaPipeTasksVision
import VideoToolbox
import Network
import WebKit

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

      if let tryOnRegistrar = registrar(forPlugin: "TryOnStudioRenderer") {
        let tryOnFactory = TryOnStudioViewFactory(
          messenger: controller.binaryMessenger,
          registrar: tryOnRegistrar
        )
        tryOnRegistrar.register(tryOnFactory, withId: "tryon_studio_view")
      }

      let googleChannel = FlutterMethodChannel(
        name: "gleame/google_signin",
        binaryMessenger: controller.binaryMessenger
      )
      googleChannel.setMethodCallHandler { call, result in
        guard call.method == "signIn" else {
          result(FlutterMethodNotImplemented)
          return
        }
        GoogleSignInBridge.shared.signIn { outcome in
          DispatchQueue.main.async {
            switch outcome {
            case .success(let idToken):
              result(idToken)
            case .failure(let error):
              result(FlutterError(
                code: "google_signin_failed",
                message: error.localizedDescription,
                details: nil
              ))
            }
          }
        }
      }

      if let webRegistrar = registrar(forPlugin: "TryOnStudioWebRenderer") {
        let webFactory = TryOnStudioWebViewFactory(
          messenger: controller.binaryMessenger,
          registrar: webRegistrar
        )
        webRegistrar.register(webFactory, withId: "tryon_studio_web_view")
      }
    }
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

private final class TryOnStudioViewFactory: NSObject, FlutterPlatformViewFactory {
  private let messenger: FlutterBinaryMessenger
  private let registrar: FlutterPluginRegistrar

  init(messenger: FlutterBinaryMessenger, registrar: FlutterPluginRegistrar) {
    self.messenger = messenger
    self.registrar = registrar
    super.init()
  }

  func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    TryOnStudioPlatformView(
      frame: frame,
      viewIdentifier: viewId,
      arguments: args,
      messenger: messenger,
      registrar: registrar
    )
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

private final class TryOnStudioPlatformView: NSObject, FlutterPlatformView {
  private let cameraView = TryOnStudioCameraView()
  private let session = AVCaptureSession()
  private let videoQueue = DispatchQueue(label: "gleame.tryonstudio.video")
  private let channel: FlutterMethodChannel
  private let registrar: FlutterPluginRegistrar
  private let overlay = TryOnStudioOverlayView()
  private var landmarker: FaceLandmarker?
  private var lastTimestamp = 0
  private var isStopped = false

  init(
    frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?,
    messenger: FlutterBinaryMessenger,
    registrar: FlutterPluginRegistrar
  ) {
    self.registrar = registrar
    channel = FlutterMethodChannel(
      name: "tryon_studio/view/\(viewId)",
      binaryMessenger: messenger
    )
    super.init()

    cameraView.frame = frame
    cameraView.overlay = overlay
    cameraView.addSubview(overlay)

    channel.setMethodCallHandler { [weak self] call, result in
      guard let self else {
        result(nil)
        return
      }
      switch call.method {
      case "setBefore":
        let args = call.arguments as? [String: Any]
        overlay.beforeEnabled = args?["enabled"] as? Bool ?? false
        overlay.setNeedsDisplay()
        result(nil)
      case "capture":
        result(self.capturePng())
      case "stop":
        self.stop()
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }

    do {
      let params = args as? [String: Any] ?? [:]
      let filterAsset = params["filterAsset"] as? String ?? ""
      let modelAsset = params["modelAsset"] as? String ?? ""
      let filter = try TryOnStudioFilter.load(asset: filterAsset, registrar: registrar)
      overlay.filter = filter
      try configureFaceLandmarker(modelAsset: modelAsset)
      try configureCamera()
      start()
      channel.invokeMethod("ready", arguments: filter.name)
    } catch {
      channel.invokeMethod("error", arguments: error.localizedDescription)
    }
  }

  func view() -> UIView {
    cameraView
  }

  deinit {
    stop()
  }

  private func configureFaceLandmarker(modelAsset: String) throws {
    guard let modelPath = flutterAssetPath(modelAsset, registrar: registrar) else {
      throw TryOnStudioError.assetMissing(modelAsset)
    }

    let baseOptions = BaseOptions()
    baseOptions.modelAssetPath = modelPath

    let options = FaceLandmarkerOptions()
    options.baseOptions = baseOptions
    // .video keeps detection synchronous, so every frame we display already
    // has its own landmarks. .liveStream handed results back a few frames late.
    options.runningMode = .video
    options.numFaces = 1
    options.minFaceDetectionConfidence = 0.48
    options.minFacePresenceConfidence = 0.48
    options.minTrackingConfidence = 0.48

    landmarker = try FaceLandmarker(options: options)
  }

  private func configureCamera() throws {
    session.beginConfiguration()
    session.sessionPreset = .hd1280x720

    guard let device = AVCaptureDevice.default(
      .builtInWideAngleCamera,
      for: .video,
      position: .front
    ) else {
      throw TryOnStudioError.cameraUnavailable
    }

    let input = try AVCaptureDeviceInput(device: device)
    guard session.canAddInput(input) else {
      throw TryOnStudioError.cameraUnavailable
    }
    session.addInput(input)

    let output = AVCaptureVideoDataOutput()
    output.alwaysDiscardsLateVideoFrames = true
    output.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]
    output.setSampleBufferDelegate(self, queue: videoQueue)
    guard session.canAddOutput(output) else {
      throw TryOnStudioError.cameraUnavailable
    }
    session.addOutput(output)

    if let connection = output.connection(with: .video) {
      if connection.isVideoOrientationSupported {
        connection.videoOrientation = .portrait
      }
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = true
      }
    }

    session.commitConfiguration()
  }

  private func start() {
    isStopped = false
    videoQueue.async { [weak self] in
      guard let self, !self.session.isRunning else { return }
      self.session.startRunning()
    }
  }

  private func stop() {
    isStopped = true
    let captureSession = session
    videoQueue.async {
      if captureSession.isRunning {
        captureSession.stopRunning()
      }
    }
  }

  private func capturePng() -> Data? {
    let renderer = UIGraphicsImageRenderer(bounds: cameraView.bounds)
    let image = renderer.image { context in
      cameraView.layer.render(in: context.cgContext)
    }
    return image.pngData()
  }
}

extension TryOnStudioPlatformView: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard
      !isStopped,
      let landmarker,
      let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer)
    else {
      return
    }

    let imageSize = CGSize(
      width: CGFloat(CVPixelBufferGetWidth(pixelBuffer)),
      height: CGFloat(CVPixelBufferGetHeight(pixelBuffer))
    )

    let seconds = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
    var timestamp = Int(seconds * 1000)
    if timestamp <= lastTimestamp {
      timestamp = lastTimestamp + 1
    }
    lastTimestamp = timestamp

    var points: [CGPoint] = []
    do {
      let image = try MPImage(sampleBuffer: sampleBuffer, orientation: .up)
      let result = try landmarker.detect(
        videoFrame: image,
        timestampInMilliseconds: timestamp
      )
      if let landmarks = result.faceLandmarks.first, landmarks.count >= 468 {
        points = landmarks.map { CGPoint(x: CGFloat($0.x), y: CGFloat($0.y)) }
      }
    } catch {
      DispatchQueue.main.async { [weak self] in
        self?.channel.invokeMethod("error", arguments: error.localizedDescription)
      }
      return
    }

    var frameImage: CGImage?
    VTCreateCGImageFromCVPixelBuffer(pixelBuffer, options: nil, imageOut: &frameImage)
    guard let frameImage else { return }

    DispatchQueue.main.async { [weak self] in
      guard let self, !self.isStopped else { return }
      // One commit: the frame and the landmarks taken from that same frame
      // reach the screen together, so the makeup stays welded to the face.
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      self.overlay.imageSize = imageSize
      self.overlay.updateLandmarks(points)
      self.cameraView.frameLayer.contents = frameImage
      self.overlay.setNeedsDisplay()
      CATransaction.commit()
    }
  }
}

private final class TryOnStudioCameraView: UIView {
  /// The camera frame is pushed here per detection rather than being shown by
  /// an AVCaptureVideoPreviewLayer. A preview layer runs ahead of the tracker,
  /// so the makeup always trailed the face; drawing the frame ourselves lets
  /// the frame and the landmarks measured from it reach the screen together.
  let frameLayer = CALayer()
  weak var overlay: UIView?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .black
    frameLayer.contentsGravity = .resizeAspectFill
    frameLayer.masksToBounds = true
    layer.addSublayer(frameLayer)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    frameLayer.frame = bounds
    CATransaction.commit()
    overlay?.frame = bounds
  }
}

private final class TryOnStudioOverlayView: UIView {
  var filter: TryOnStudioFilter?
  private(set) var landmarks: [CGPoint] = []
  var imageSize = CGSize(width: 720, height: 1280)
  var beforeEnabled = false

  override init(frame: CGRect) {
    super.init(frame: frame)
    // Without these the overlay is an opaque view: UIKit stops clearing it
    // between draws, so every frame stacks on the last and it hides the
    // camera layer underneath it.
    isOpaque = false
    backgroundColor = .clear
    contentMode = .redraw
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  /// Ported from TryOn Studio's `smoothFace` / `stabilizeLipShape`.
  ///
  /// `keep` is the weight of the PREVIOUS position, and the values are tiny
  /// (0.018-0.08), so position tracks the tracker almost exactly and the lips
  /// stay attached. Shape is what gets smoothed heavily, and only inside a lip
  /// local frame, so wobble is removed without the lips lagging the face.
  private static let lipIds: Set<Int> = [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
    375, 321, 405, 314, 17, 84, 181, 91, 146,
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
    324, 318, 402, 317, 14, 87, 178, 88, 95
  ]

  private static let eyeIds: Set<Int> = [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
    263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249,
    226, 247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25,
    446, 467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255
  ]

  func updateLandmarks(_ incoming: [CGPoint]) {
    guard !incoming.isEmpty else {
      landmarks = []
      return
    }
    guard landmarks.count == incoming.count else {
      landmarks = incoming
      return
    }

    let previous = landmarks
    let movement = maxLandmarkDelta(incoming, previous)
    let faceKeep: CGFloat = movement > 0.006 ? 0.028 : 0.08
    let lipKeep: CGFloat = movement > 0.0025 ? 0.018 : 0.055
    let eyeKeep: CGFloat = movement > 0.0025
      ? Swift.min(faceKeep, 0.024)
      : Swift.min(faceKeep, 0.075)
    let lipShapeKeep: CGFloat = movement > 0.01
      ? 0.04
      : movement > 0.004 ? 0.14 : movement > 0.002 ? 0.3 : 0.56

    var smoothed = incoming
    for index in 0..<incoming.count {
      let keep: CGFloat
      if Self.lipIds.contains(index) {
        keep = lipKeep
      } else if Self.eyeIds.contains(index) {
        keep = eyeKeep
      } else {
        keep = faceKeep
      }
      smoothed[index] = CGPoint(
        x: previous[index].x * keep + incoming[index].x * (1 - keep),
        y: previous[index].y * keep + incoming[index].y * (1 - keep)
      )
    }

    landmarks = stabilizeLipShape(
      next: incoming,
      previous: previous,
      smoothed: smoothed,
      keep: lipShapeKeep
    )
  }

  private func maxLandmarkDelta(_ next: [CGPoint], _ previous: [CGPoint]) -> CGFloat {
    var largest: CGFloat = 0
    for index in Self.lipIds.union(Self.eyeIds) {
      guard index < next.count, index < previous.count else { continue }
      largest = Swift.max(
        largest,
        hypot(next[index].x - previous[index].x, next[index].y - previous[index].y)
      )
    }
    return largest
  }

  private struct LipFrame {
    let center: CGPoint
    let scale: CGFloat
    let cos: CGFloat
    let sin: CGFloat
  }

  private func lipMotionFrame(_ points: [CGPoint]) -> LipFrame? {
    let anchorIds = [61, 291, 0, 17, 13, 14, 78, 308]
    guard
      points.count > 308,
      let left = points.indices.contains(61) ? points[61] : nil,
      let right = points.indices.contains(291) ? points[291] : nil
    else {
      return nil
    }
    var center = CGPoint.zero
    var count: CGFloat = 0
    for id in anchorIds where points.indices.contains(id) {
      center.x += points[id].x
      center.y += points[id].y
      count += 1
    }
    guard count > 0 else { return nil }
    center.x /= count
    center.y /= count

    let dx = right.x - left.x
    let dy = right.y - left.y
    let scale = Swift.max(0.0001, hypot(dx, dy))
    return LipFrame(center: center, scale: scale, cos: dx / scale, sin: dy / scale)
  }

  private func toLipLocal(_ point: CGPoint, _ frame: LipFrame) -> CGPoint {
    let dx = point.x - frame.center.x
    let dy = point.y - frame.center.y
    return CGPoint(
      x: (dx * frame.cos + dy * frame.sin) / frame.scale,
      y: (-dx * frame.sin + dy * frame.cos) / frame.scale
    )
  }

  private func fromLipLocal(_ point: CGPoint, _ frame: LipFrame) -> CGPoint {
    CGPoint(
      x: frame.center.x + (point.x * frame.cos - point.y * frame.sin) * frame.scale,
      y: frame.center.y + (point.x * frame.sin + point.y * frame.cos) * frame.scale
    )
  }

  private func stabilizeLipShape(
    next: [CGPoint],
    previous: [CGPoint],
    smoothed: [CGPoint],
    keep: CGFloat
  ) -> [CGPoint] {
    guard
      let currentFrame = lipMotionFrame(next),
      let previousFrame = lipMotionFrame(previous)
    else {
      return smoothed
    }

    var output = smoothed
    for id in Self.lipIds {
      guard id < next.count, id < previous.count else { continue }
      let rawLocal = toLipLocal(next[id], currentFrame)
      let oldLocal = toLipLocal(previous[id], previousFrame)
      let local = CGPoint(
        x: oldLocal.x * keep + rawLocal.x * (1 - keep),
        y: oldLocal.y * keep + rawLocal.y * (1 - keep)
      )
      output[id] = fromLipLocal(local, currentFrame)
    }
    return output
  }

  override func draw(_ rect: CGRect) {
    guard
      !beforeEnabled,
      let filter,
      landmarks.count >= 468,
      let context = UIGraphicsGetCurrentContext()
    else {
      return
    }

    let controls = filter.controls
    let globalIntensity = controls.globalIntensity
    let layerOrder = controls.layerOrder.isEmpty ? ["lips", "lipliner"] : controls.layerOrder
    let scale = faceScale()
    let lipAmount = filter.layers["lips"] == false ? 0 : filter.intensity["lips", default: 0] * globalIntensity
    let linerAmount = filter.layers["lipliner"] == false ? 0 : filter.intensity["lipliner", default: 0] * globalIntensity
    let lipColor = filter.palette["lips"] ?? UIColor(red: 0.78, green: 0.37, blue: 0.51, alpha: 1)
    let linerColor = filter.palette["lipliner"] ?? UIColor(red: 0.43, green: 0.20, blue: 0.25, alpha: 1)
    let softBlur = max(0.35, scale * 0.0018)
    let edgeBlur = max(0.4, scale * 0.0028 * controls.edgeSoftness)

    var drewGloss = false
    var drewShimmer = false

    for layer in layerOrder {
      if layer == "lips", lipAmount > 0 {
        let colorOpacity = clamp(
          lipAmount * (0.56 + controls.blend * 0.48) * (1 - controls.sheer * 0.42),
          min: 0,
          max: 0.92
        )
        let textureOpacity = clamp(
          lipAmount * controls.textureDetail * (1 - controls.sheer * 0.32),
          min: 0,
          max: 0.86
        )
        drawTintedMesh(
          context,
          region: "lips",
          color: lipColor,
          opacity: colorOpacity,
          blendMode: .normal,
          blur: softBlur
        )
        if filter.textures["lips"]?.isFlatMask == false {
          drawTintedMesh(
            context,
            region: "lips",
            color: .white,
            opacity: textureOpacity * 0.55,
            blendMode: .multiply,
            blur: edgeBlur,
            artwork: true
          )
        } else {
          drawTintedMesh(
            context,
            region: "lips",
            color: mix(lipColor, UIColor(red: 0.11, green: 0.03, blue: 0.02, alpha: 1), amount: 0.22),
            opacity: textureOpacity * 0.14,
            blendMode: .multiply,
            blur: edgeBlur
          )
        }
        fillLipPath(context, ids: filter.mesh.lipsUpperOuter, color: lipColor, opacity: colorOpacity * 0.10, blendMode: .color, blur: softBlur)
        fillLipPath(context, ids: filter.mesh.lipsLowerOuter, color: lipColor, opacity: colorOpacity * 0.13, blendMode: .color, blur: softBlur)
      }

      if layer == "lipshimmer", lipAmount > 0, controls.shimmer > 0, !drewShimmer {
        drewShimmer = true
        drawLipShimmer(context, opacity: lipAmount * controls.shimmer, blur: softBlur)
      }

      if layer == "lipgloss", lipAmount > 0, controls.gloss > 0, !drewGloss {
        drewGloss = true
        drawLipGloss(context, color: lipColor, opacity: lipAmount * controls.gloss, blur: softBlur)
      }

      if layer == "lipliner", linerAmount > 0 {
        let linerOpacity = clamp(linerAmount * (0.42 + controls.linerThickness * 0.52), min: 0, max: 0.9)
        let width = max(1.25, scale * (0.0028 + controls.linerThickness * 0.0082))
        drawTintedMesh(
          context,
          region: "lipliner",
          color: linerColor,
          opacity: linerOpacity,
          blendMode: .normal,
          blur: softBlur
        )
        drawTintedMesh(
          context,
          region: "lipliner",
          color: mix(linerColor, UIColor(red: 0.03, green: 0.01, blue: 0.01, alpha: 1), amount: 0.34),
          opacity: linerOpacity * 0.26,
          blendMode: .multiply,
          blur: edgeBlur
        )
        strokeLipPath(
          context,
          ids: filter.mesh.lipsOuter,
          color: linerColor,
          opacity: linerOpacity * 0.72,
          width: width,
          blendMode: .normal,
          blur: max(0.25, scale * 0.0014)
        )
      }
    }

    if lipAmount > 0, controls.shimmer > 0, !drewShimmer {
      drawLipShimmer(context, opacity: lipAmount * controls.shimmer, blur: softBlur)
    }
    if lipAmount > 0, controls.gloss > 0, !drewGloss {
      drawLipGloss(context, color: lipColor, opacity: lipAmount * controls.gloss, blur: softBlur)
    }

    clearLipPath(context, ids: filter.mesh.lipsInner)
  }

  private func drawTintedMesh(
    _ context: CGContext,
    region: String,
    color: UIColor,
    opacity: CGFloat,
    blendMode: CGBlendMode,
    blur: CGFloat,
    artwork: Bool = false
  ) {
    guard opacity > 0, let filter, let texture = filter.textures[region] else { return }

    context.saveGState()
    context.setBlendMode(blendMode)
    context.setAlpha(opacity)
    if blur > 0 {
      context.setShadow(offset: .zero, blur: blur, color: UIColor.clear.cgColor)
    }

    for triangle in filter.mesh.triangles {
      drawTintedTriangle(
        context,
        triangle: triangle,
        texture: texture,
        color: color,
        artwork: artwork
      )
    }

    context.restoreGState()
  }

  private func drawTintedTriangle(
    _ context: CGContext,
    triangle: [Int],
    texture: TryOnStudioTexture,
    color: UIColor,
    artwork: Bool
  ) {
    guard triangle.count == 3 else { return }
    guard
      let uvA = filter?.mesh.uv[triangle[0]],
      let uvB = filter?.mesh.uv[triangle[1]],
      let uvC = filter?.mesh.uv[triangle[2]]
    else {
      return
    }

    let source = [
      CGPoint(x: uvA.x * texture.size.width, y: uvA.y * texture.size.height),
      CGPoint(x: uvB.x * texture.size.width, y: uvB.y * texture.size.height),
      CGPoint(x: uvC.x * texture.size.width, y: uvC.y * texture.size.height)
    ]
    let dest = [
      point(for: triangle[0]),
      point(for: triangle[1]),
      point(for: triangle[2])
    ]
    guard let transform = affineTransform(source: source, dest: dest) else { return }

    context.saveGState()
    let path = CGMutablePath()
    path.move(to: dest[0])
    path.addLine(to: dest[1])
    path.addLine(to: dest[2])
    path.closeSubpath()
    context.addPath(path)
    context.clip()
    context.concatenate(transform)
    let bounds = CGRect(origin: .zero, size: texture.size)
    context.clip(to: bounds, mask: texture.mask)
    if artwork {
      // "mesh-multiply-with-tint": the painted shading of the source artwork,
      // multiplied over the tint that was already laid down.
      context.draw(texture.image, in: bounds)
    } else {
      context.setFillColor(color.cgColor)
      context.fill(bounds)
    }
    context.restoreGState()
  }

  private func fillLipPath(
    _ context: CGContext,
    ids: [Int],
    color: UIColor,
    opacity: CGFloat,
    blendMode: CGBlendMode,
    blur: CGFloat
  ) {
    guard opacity > 0 else { return }
    context.saveGState()
    context.setBlendMode(blendMode)
    context.setAlpha(opacity)
    if blur > 0 {
      context.setShadow(offset: .zero, blur: blur, color: color.cgColor)
    }
    context.addPath(curvedPath(ids: ids))
    context.setFillColor(color.cgColor)
    context.fillPath()
    context.restoreGState()
  }

  private func strokeLipPath(
    _ context: CGContext,
    ids: [Int],
    color: UIColor,
    opacity: CGFloat,
    width: CGFloat,
    blendMode: CGBlendMode,
    blur: CGFloat
  ) {
    guard opacity > 0 else { return }
    context.saveGState()
    context.setBlendMode(blendMode)
    context.setAlpha(opacity)
    if blur > 0 {
      context.setShadow(offset: .zero, blur: blur, color: color.cgColor)
    }
    context.addPath(curvedPath(ids: ids))
    context.setStrokeColor(color.cgColor)
    context.setLineWidth(width)
    context.setLineCap(.round)
    context.setLineJoin(.round)
    context.strokePath()
    context.restoreGState()
  }

  private func clearLipPath(_ context: CGContext, ids: [Int]) {
    context.saveGState()
    context.setBlendMode(.clear)
    context.addPath(curvedPath(ids: ids))
    context.fillPath()
    context.restoreGState()
  }

  private func drawLipShimmer(_ context: CGContext, opacity: CGFloat, blur: CGFloat) {
    guard opacity > 0, let filter else { return }
    drawTintedMesh(
      context,
      region: "lipshimmer",
      color: filter.controls.shimmerColor,
      opacity: clamp(opacity * 0.72, min: 0, max: 0.7),
      blendMode: .screen,
      blur: blur
    )
  }

  private func drawLipGloss(_ context: CGContext, color: UIColor, opacity: CGFloat, blur: CGFloat) {
    guard opacity > 0 else { return }
    let scale = faceScale()
    let shine = mix(.white, color, amount: 0.12)

    // Packages that ship a gloss mask get the real wet-look pass; every look
    // still gets the centred specular highlight on top.
    drawTintedMesh(
      context,
      region: "lipgloss",
      color: shine,
      opacity: clamp(opacity * 0.55, min: 0, max: 0.55),
      blendMode: .screen,
      blur: blur
    )

    context.saveGState()
    context.setBlendMode(.screen)
    context.setAlpha(clamp(opacity * 0.34, min: 0, max: 0.26))
    context.addPath(openCurvePath(ids: [88, 178, 87, 14, 317, 402, 318]))
    context.setStrokeColor(shine.cgColor)
    context.setLineWidth(max(1.2, scale * 0.006))
    context.setLineCap(.round)
    context.setLineJoin(.round)
    context.strokePath()
    context.restoreGState()
  }

  private func curvedPath(ids: [Int]) -> CGPath {
    let mapped = ids.map { point(for: $0) }
    let path = CGMutablePath()
    guard let first = mapped.first else { return path }
    if mapped.count < 3 {
      path.move(to: first)
      mapped.dropFirst().forEach { path.addLine(to: $0) }
      path.closeSubpath()
      return path
    }
    let start = midpoint(mapped[mapped.count - 1], mapped[0])
    path.move(to: start)
    for index in 0..<mapped.count {
      let point = mapped[index]
      let next = mapped[(index + 1) % mapped.count]
      let mid = midpoint(point, next)
      path.addQuadCurve(to: mid, control: point)
    }
    path.closeSubpath()
    return path
  }

  private func openCurvePath(ids: [Int]) -> CGPath {
    let mapped = ids.map { point(for: $0) }
    let path = CGMutablePath()
    guard let first = mapped.first else { return path }
    path.move(to: first)
    if mapped.count < 3 {
      mapped.dropFirst().forEach { path.addLine(to: $0) }
      return path
    }
    for index in 1..<(mapped.count - 1) {
      let mid = midpoint(mapped[index], mapped[index + 1])
      path.addQuadCurve(to: mid, control: mapped[index])
    }
    if let last = mapped.last {
      path.addLine(to: last)
    }
    return path
  }

  private func point(for landmarkIndex: Int) -> CGPoint {
    guard landmarkIndex >= 0, landmarkIndex < landmarks.count else { return .zero }
    let landmark = landmarks[landmarkIndex]
    let viewSize = bounds.size
    let imageAspect = imageSize.width / max(1, imageSize.height)
    let viewAspect = viewSize.width / max(1, viewSize.height)
    var drawSize = viewSize
    var offset = CGPoint.zero

    if imageAspect > viewAspect {
      drawSize.height = viewSize.height
      drawSize.width = viewSize.height * imageAspect
      offset.x = (viewSize.width - drawSize.width) * 0.5
    } else {
      drawSize.width = viewSize.width
      drawSize.height = viewSize.width / max(0.001, imageAspect)
      offset.y = (viewSize.height - drawSize.height) * 0.5
    }

    return CGPoint(
      x: offset.x + landmark.x * drawSize.width,
      y: offset.y + landmark.y * drawSize.height
    )
  }

  private func faceScale() -> CGFloat {
    let left = point(for: 234)
    let right = point(for: 454)
    return max(1, hypot(right.x - left.x, right.y - left.y))
  }
}

private struct TryOnStudioFilter {
  let name: String
  let palette: [String: UIColor]
  let intensity: [String: CGFloat]
  let layers: [String: Bool]
  let controls: TryOnStudioLipControls
  let mesh: TryOnStudioMesh
  let textures: [String: TryOnStudioTexture]

  static func load(asset: String, registrar: FlutterPluginRegistrar) throws -> TryOnStudioFilter {
    guard let path = flutterAssetPath(asset, registrar: registrar) else {
      throw TryOnStudioError.assetMissing(asset)
    }
    let data = try Data(contentsOf: URL(fileURLWithPath: path))
    guard
      let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      json["schema"] as? String == "tryonstudio.filter.v1",
      json["format"] as? String == "tryonfilter-json"
    else {
      throw TryOnStudioError.invalidFilter
    }

    guard
      let look = json["look"] as? [String: Any],
      let meshJson = json["mesh"] as? [String: Any]
    else {
      throw TryOnStudioError.invalidFilter
    }

    let palette = parsePalette(look["palette"] as? [String: Any] ?? [:])
    let intensity = parseCGFloatMap(look["intensity"] as? [String: Any] ?? [:])
    let layers = parseBoolMap(json["layers"] as? [String: Any] ?? [:])
    let controls = TryOnStudioLipControls(json: json["lipControls"] as? [String: Any] ?? [:])
    let mesh = try TryOnStudioMesh(json: meshJson)
    let textures = parseTextures(json["assets"] as? [[String: Any]] ?? [])

    return TryOnStudioFilter(
      name: (look["name"] as? String) ?? (json["name"] as? String) ?? "TryOn Studio Filter",
      palette: palette,
      intensity: intensity,
      layers: layers,
      controls: controls,
      mesh: mesh,
      textures: textures
    )
  }
}

private struct TryOnStudioLipControls {
  let finish: String
  let gloss: CGFloat
  let shimmer: CGFloat
  let shimmerColor: UIColor
  let edgeSoftness: CGFloat
  let textureDetail: CGFloat
  let sheer: CGFloat
  let blend: CGFloat
  let linerThickness: CGFloat
  let linerBlend: CGFloat
  let linerMelt: CGFloat
  let smoothing: CGFloat
  let globalIntensity: CGFloat
  let layerOrder: [String]

  init(json: [String: Any]) {
    finish = json["finish"] as? String ?? "satin"
    gloss = parseCGFloat(json["gloss"], fallback: 0.22)
    shimmer = parseCGFloat(json["shimmer"], fallback: 0)
    shimmerColor = UIColor(hex: json["shimmerColor"] as? String ?? "#f3b6cf")
    edgeSoftness = parseCGFloat(json["edgeSoftness"], fallback: 0.44)
    textureDetail = parseCGFloat(json["textureDetail"], fallback: 0.68)
    sheer = parseCGFloat(json["sheer"], fallback: 0.08)
    blend = parseCGFloat(json["blend"], fallback: 1)
    linerThickness = parseCGFloat(json["linerThickness"], fallback: 0.65)
    linerBlend = parseCGFloat(json["linerBlend"], fallback: 0.78)
    linerMelt = parseCGFloat(json["linerMelt"], fallback: 0.42)
    smoothing = parseCGFloat(json["smoothing"], fallback: 0.16)
    globalIntensity = parseCGFloat(json["globalIntensity"], fallback: 0.75)
    layerOrder = json["layerOrder"] as? [String] ?? ["lips", "lipshimmer", "lipliner", "lipgloss"]
  }
}

private struct TryOnStudioMesh {
  let lipsOuter: [Int]
  let lipsInner: [Int]
  let lipsUpperOuter: [Int]
  let lipsLowerOuter: [Int]
  let uv: [Int: CGPoint]
  let triangles: [[Int]]

  init(json: [String: Any]) throws {
    lipsOuter = parseIntArray(json["lipsOuter"])
    lipsInner = parseIntArray(json["lipsInner"])
    lipsUpperOuter = parseIntArray(json["lipsUpperOuter"])
    lipsLowerOuter = parseIntArray(json["lipsLowerOuter"])
    uv = parseUv(json["uv"] as? [String: Any] ?? [:])
    triangles = (json["triangles"] as? [[Any]] ?? []).map { parseIntArray($0) }.filter { $0.count == 3 }

    if lipsOuter.isEmpty || lipsInner.isEmpty || uv.isEmpty || triangles.isEmpty {
      throw TryOnStudioError.invalidFilter
    }
  }
}

private struct TryOnStudioTexture {
  /// Per-pixel coverage taken from the PNG's alpha channel.
  let mask: CGImage
  /// The artwork itself, multiplied over the tint for `mesh-multiply-with-tint`.
  let image: CGImage
  let size: CGSize
  /// True when the artwork is flat white and the multiply pass would be a no-op.
  let isFlatMask: Bool
}

private enum TryOnStudioError: LocalizedError {
  case assetMissing(String)
  case invalidFilter
  case cameraUnavailable

  var errorDescription: String? {
    switch self {
    case .assetMissing(let asset):
      return "Missing TryOn Studio asset: \(asset)"
    case .invalidFilter:
      return "Invalid TryOn Studio filter."
    case .cameraUnavailable:
      return "Native camera is unavailable."
    }
  }
}

private func flutterAssetPath(_ asset: String, registrar: FlutterPluginRegistrar) -> String? {
  let key = registrar.lookupKey(forAsset: asset)
  let candidates = [
    Bundle.main.path(forResource: key, ofType: nil),
    Bundle.main.path(forResource: asset, ofType: nil),
    "\(Bundle.main.bundlePath)/\(key)",
    "\(Bundle.main.bundlePath)/Frameworks/App.framework/flutter_assets/\(asset)",
    "\(Bundle.main.bundlePath)/Frameworks/App.framework/\(key)"
  ]
  return candidates.compactMap { $0 }.first { FileManager.default.fileExists(atPath: $0) }
}

private func parsePalette(_ json: [String: Any]) -> [String: UIColor] {
  var palette: [String: UIColor] = [:]
  json.forEach { key, value in
    if let hex = value as? String {
      palette[key] = UIColor(hex: hex)
    }
  }
  return palette
}

private func parseCGFloatMap(_ json: [String: Any]) -> [String: CGFloat] {
  var result: [String: CGFloat] = [:]
  json.forEach { key, value in
    result[key] = parseCGFloat(value, fallback: 0)
  }
  return result
}

private func parseBoolMap(_ json: [String: Any]) -> [String: Bool] {
  var result: [String: Bool] = [:]
  json.forEach { key, value in
    if let bool = value as? Bool {
      result[key] = bool
    } else if let number = value as? NSNumber {
      result[key] = number.boolValue
    }
  }
  return result
}

private func parseTextures(_ assets: [[String: Any]]) -> [String: TryOnStudioTexture] {
  var textures: [String: TryOnStudioTexture] = [:]
  for asset in assets {
    guard
      let region = asset["region"] as? String,
      let dataUrl = asset["dataUrl"] as? String,
      let comma = dataUrl.firstIndex(of: ","),
      let data = Data(base64Encoded: String(dataUrl[dataUrl.index(after: comma)...])),
      let image = UIImage(data: data),
      let cgImage = image.cgImage,
      let coverage = makeCoverageMask(from: cgImage)
    else {
      continue
    }
    textures[region] = TryOnStudioTexture(
      mask: coverage.mask,
      image: cgImage,
      size: CGSize(width: coverage.mask.width, height: coverage.mask.height),
      isFlatMask: coverage.isFlatMask
    )
  }
  return textures
}

/// Builds the clip mask from the PNG's alpha channel.
///
/// The previous version drew the RGBA artwork straight into a grey context, so
/// coverage came out as luminance x alpha. That is the same thing as alpha for
/// the older white-on-transparent masks, but the TryOn Studio lip packages ship
/// fully painted artwork - there the dark areas of the painting were being read
/// as "do not paint", which stencilled the artwork onto the face instead of
/// wearing it. Alpha is the only channel that carries coverage.
private func makeCoverageMask(
  from cgImage: CGImage
) -> (mask: CGImage, isFlatMask: Bool)? {
  let width = cgImage.width
  let height = cgImage.height
  guard width > 0, height > 0 else { return nil }

  let pixelCount = width * height
  let bytesPerRow = width * 4
  var rgba = [UInt8](repeating: 0, count: bytesPerRow * height)
  guard let rgbaContext = CGContext(
    data: &rgba,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else {
    return nil
  }
  rgbaContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

  var coverage = [UInt8](repeating: 0, count: pixelCount)
  var darkCovered = 0
  var covered = 0
  for index in 0..<pixelCount {
    let offset = index * 4
    let alpha = rgba[offset + 3]
    coverage[index] = alpha
    guard alpha > 200 else { continue }
    covered += 1
    // premultiplied, so un-premultiply before judging brightness
    let scale = 255.0 / Double(alpha)
    let red = Double(rgba[offset]) * scale
    let green = Double(rgba[offset + 1]) * scale
    let blue = Double(rgba[offset + 2]) * scale
    if 0.299 * red + 0.587 * green + 0.114 * blue < 236 {
      darkCovered += 1
    }
  }

  guard let maskContext = CGContext(
    data: &coverage,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: width,
    space: CGColorSpaceCreateDeviceGray(),
    bitmapInfo: CGImageAlphaInfo.none.rawValue
  ), let mask = maskContext.makeImage() else {
    return nil
  }

  // A near-white artwork carries no shading worth multiplying back in.
  let isFlatMask = covered == 0 || Double(darkCovered) / Double(covered) < 0.04
  return (mask, isFlatMask)
}

private func parseUv(_ json: [String: Any]) -> [Int: CGPoint] {
  var uv: [Int: CGPoint] = [:]
  json.forEach { key, value in
    guard
      let index = Int(key),
      let point = value as? [String: Any]
    else {
      return
    }
    uv[index] = CGPoint(
      x: parseCGFloat(point["x"], fallback: 0),
      y: parseCGFloat(point["y"], fallback: 0)
    )
  }
  return uv
}

private func parseIntArray(_ value: Any?) -> [Int] {
  (value as? [Any] ?? []).compactMap { item in
    if let int = item as? Int { return int }
    if let number = item as? NSNumber { return number.intValue }
    return nil
  }
}

private func parseCGFloat(_ value: Any?, fallback: CGFloat) -> CGFloat {
  if let value = value as? CGFloat { return value }
  if let value = value as? Double { return CGFloat(value) }
  if let value = value as? Float { return CGFloat(value) }
  if let value = value as? Int { return CGFloat(value) }
  if let value = value as? NSNumber { return CGFloat(truncating: value) }
  return fallback
}

private func affineTransform(source: [CGPoint], dest: [CGPoint]) -> CGAffineTransform? {
  guard source.count == 3, dest.count == 3 else { return nil }
  let denominator = source[0].x * (source[1].y - source[2].y)
    + source[1].x * (source[2].y - source[0].y)
    + source[2].x * (source[0].y - source[1].y)
  if abs(denominator) < 0.0001 { return nil }

  let a = (dest[0].x * (source[1].y - source[2].y)
    + dest[1].x * (source[2].y - source[0].y)
    + dest[2].x * (source[0].y - source[1].y)) / denominator
  let b = (dest[0].y * (source[1].y - source[2].y)
    + dest[1].y * (source[2].y - source[0].y)
    + dest[2].y * (source[0].y - source[1].y)) / denominator
  let c = (dest[0].x * (source[2].x - source[1].x)
    + dest[1].x * (source[0].x - source[2].x)
    + dest[2].x * (source[1].x - source[0].x)) / denominator
  let d = (dest[0].y * (source[2].x - source[1].x)
    + dest[1].y * (source[0].x - source[2].x)
    + dest[2].y * (source[1].x - source[0].x)) / denominator
  let tx = (dest[0].x * (source[1].x * source[2].y - source[2].x * source[1].y)
    + dest[1].x * (source[2].x * source[0].y - source[0].x * source[2].y)
    + dest[2].x * (source[0].x * source[1].y - source[1].x * source[0].y)) / denominator
  let ty = (dest[0].y * (source[1].x * source[2].y - source[2].x * source[1].y)
    + dest[1].y * (source[2].x * source[0].y - source[0].x * source[2].y)
    + dest[2].y * (source[0].x * source[1].y - source[1].x * source[0].y)) / denominator

  return CGAffineTransform(a: a, b: b, c: c, d: d, tx: tx, ty: ty)
}

private func midpoint(_ a: CGPoint, _ b: CGPoint) -> CGPoint {
  CGPoint(x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5)
}

private func clamp(_ value: CGFloat, min: CGFloat, max: CGFloat) -> CGFloat {
  Swift.max(min, Swift.min(max, value))
}

private func mix(_ a: UIColor, _ b: UIColor, amount: CGFloat) -> UIColor {
  var ar: CGFloat = 0
  var ag: CGFloat = 0
  var ab: CGFloat = 0
  var aa: CGFloat = 0
  var br: CGFloat = 0
  var bg: CGFloat = 0
  var bb: CGFloat = 0
  var ba: CGFloat = 0
  a.getRed(&ar, green: &ag, blue: &ab, alpha: &aa)
  b.getRed(&br, green: &bg, blue: &bb, alpha: &ba)
  let t = clamp(amount, min: 0, max: 1)
  return UIColor(
    red: ar * (1 - t) + br * t,
    green: ag * (1 - t) + bg * t,
    blue: ab * (1 - t) + bb * t,
    alpha: aa * (1 - t) + ba * t
  )
}

private extension UIColor {
  convenience init(hex: String) {
    let cleaned = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    let expanded: String
    if cleaned.count == 3 {
      expanded = cleaned.map { "\($0)\($0)" }.joined()
    } else {
      expanded = String(cleaned.prefix(6)).padding(toLength: 6, withPad: "0", startingAt: 0)
    }

    var value: UInt64 = 0
    Scanner(string: expanded).scanHexInt64(&value)
    self.init(
      red: CGFloat((value >> 16) & 0xff) / 255,
      green: CGFloat((value >> 8) & 0xff) / 255,
      blue: CGFloat(value & 0xff) / 255,
      alpha: 1
    )
  }
}

// MARK: - TryOn Studio web renderer
//
// One engine for every look. The bundled TryOn Studio phone preview is served
// over http://127.0.0.1 (a secure origin, which getUserMedia requires - file://
// is refused) and driven through the same two endpoints the desktop Studio
// exposes, so the preview page itself needs no modification.


final class TryOnStudioPreviewServer {
  static let shared = TryOnStudioPreviewServer()

  private var listener: NWListener?
  private let queue = DispatchQueue(label: "gleame.tryonstudio.server")
  private var eventClients: [NWConnection] = []
  private var payload = Data("{}".utf8)
  private(set) var port: UInt16 = 0
  private var root = ""

  func start(root: String) throws -> UInt16 {
    if let listener, listener.state == .ready, port != 0 { return port }
    self.root = root

    let parameters = NWParameters.tcp
    parameters.allowLocalEndpointReuse = true
    let listener = try NWListener(using: parameters, on: .any)
    listener.newConnectionHandler = { [weak self] connection in
      self?.accept(connection)
    }

    let ready = DispatchSemaphore(value: 0)
    listener.stateUpdateHandler = { state in
      if case .ready = state { ready.signal() }
      if case .failed = state { ready.signal() }
    }
    listener.start(queue: queue)
    _ = ready.wait(timeout: .now() + 5)

    guard let resolved = listener.port?.rawValue else {
      throw TryOnStudioError.cameraUnavailable
    }
    self.listener = listener
    port = resolved
    return resolved
  }

  /// Pushes a new look to the page as the `preview` SSE event Studio sends.
  func update(payload data: Data) {
    queue.async {
      self.payload = data
      guard !self.eventClients.isEmpty else { return }
      var frame = Data("event: preview\ndata: ".utf8)
      frame.append(data)
      frame.append(Data("\n\n".utf8))
      let chunk = self.chunked(frame)
      for client in self.eventClients {
        client.send(content: chunk, completion: .idempotent)
      }
    }
  }

  private func chunked(_ body: Data) -> Data {
    var out = Data(String(format: "%lX\r\n", body.count).utf8)
    out.append(body)
    out.append(Data("\r\n".utf8))
    return out
  }

  private func accept(_ connection: NWConnection) {
    connection.start(queue: queue)
    receive(connection, buffer: Data())
  }

  private func receive(_ connection: NWConnection, buffer: Data) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, isComplete, error in
      guard let self else { return }
      var accumulated = buffer
      if let data { accumulated.append(data) }

      if error != nil || (isComplete && accumulated.isEmpty) {
        self.drop(connection)
        return
      }

      guard let headerEnd = accumulated.range(of: Data("\r\n\r\n".utf8)) else {
        if accumulated.count > 65536 { self.drop(connection); return }
        self.receive(connection, buffer: accumulated)
        return
      }

      let head = String(decoding: accumulated[..<headerEnd.lowerBound], as: UTF8.self)
      let line = head.split(separator: "\r\n", maxSplits: 1).first.map(String.init) ?? ""
      let parts = line.split(separator: " ")
      let path = parts.count >= 2 ? String(parts[1]) : "/"
      self.respond(connection, path: path)
    }
  }

  private func drop(_ connection: NWConnection) {
    eventClients.removeAll { $0 === connection }
    connection.cancel()
  }

  private func respond(_ connection: NWConnection, path rawPath: String) {
    let path = rawPath.split(separator: "?").first.map(String.init) ?? "/"

    if path == "/events" {
      let head = """
      HTTP/1.1 200 OK\r
      Content-Type: text/event-stream\r
      Cache-Control: no-cache\r
      Connection: keep-alive\r
      Transfer-Encoding: chunked\r
      \r\n
      """
      connection.send(content: Data(head.utf8), completion: .idempotent)
      eventClients.append(connection)
      var frame = Data("event: preview\ndata: ".utf8)
      frame.append(payload)
      frame.append(Data("\n\n".utf8))
      connection.send(content: chunked(frame), completion: .idempotent)
      return
    }

    if path == "/phone-preview-state" {
      send(connection, status: "200 OK", type: "application/json", body: payload)
      return
    }

    let relative = path == "/" ? "phone-preview.html" : String(path.drop(while: { $0 == "/" }))
    let full = (root as NSString).appendingPathComponent(relative)
    guard
      !relative.contains(".."),
      let body = FileManager.default.contents(atPath: full)
    else {
      send(connection, status: "404 Not Found", type: "text/plain", body: Data("not found".utf8))
      return
    }
    send(connection, status: "200 OK", type: Self.mimeType(for: relative), body: body)
  }

  private func send(_ connection: NWConnection, status: String, type: String, body: Data) {
    let head = """
    HTTP/1.1 \(status)\r
    Content-Type: \(type)\r
    Content-Length: \(body.count)\r
    Cache-Control: no-store\r
    Cross-Origin-Opener-Policy: same-origin\r
    Cross-Origin-Embedder-Policy: require-corp\r
    Cross-Origin-Resource-Policy: cross-origin\r
    Connection: close\r
    \r\n
    """
    var out = Data(head.utf8)
    out.append(body)
    connection.send(content: out, completion: .contentProcessed { _ in
      connection.cancel()
    })
  }

  private static func mimeType(for path: String) -> String {
    switch (path as NSString).pathExtension.lowercased() {
    case "html": return "text/html; charset=utf-8"
    case "js", "mjs": return "text/javascript; charset=utf-8"
    case "css": return "text/css; charset=utf-8"
    case "json": return "application/json"
    case "wasm": return "application/wasm"
    case "png": return "image/png"
    case "jpg", "jpeg": return "image/jpeg"
    case "webp": return "image/webp"
    default: return "application/octet-stream"
    }
  }
}

final class TryOnStudioWebViewFactory: NSObject, FlutterPlatformViewFactory {
  private let messenger: FlutterBinaryMessenger
  private let registrar: FlutterPluginRegistrar

  init(messenger: FlutterBinaryMessenger, registrar: FlutterPluginRegistrar) {
    self.messenger = messenger
    self.registrar = registrar
    super.init()
  }

  func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    TryOnStudioWebPlatformView(
      frame: frame,
      viewIdentifier: viewId,
      arguments: args,
      messenger: messenger,
      registrar: registrar
    )
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

final class TryOnStudioWebPlatformView: NSObject, FlutterPlatformView, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {
  private let webView: WKWebView
  private let channel: FlutterMethodChannel
  private var didSignalReady = false
  private var lastAppliedSize = (640, 360)

  init(
    frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?,
    messenger: FlutterBinaryMessenger,
    registrar: FlutterPluginRegistrar
  ) {
    let configuration = WKWebViewConfiguration()
    configuration.allowsInlineMediaPlayback = true
    configuration.mediaTypesRequiringUserActionForPlayback = []

    // The preview page ships Studio's own chrome - title, status line, fps
    // counter, filter/lip toggles and the start panel. Users should see only
    // the camera and the makeup, so hide all of it and start the camera
    // ourselves; the app has already taken the camera permission.
    // Capture at 640x360 instead of 1280x720. Every canvas in the renderer is
    // sized from the video, and the blush/contour sheets warp ~850 mesh
    // triangles into one each frame, so cost scales with pixel count: this is
    // 4x fewer pixels for the whole pipeline, tracker included.
    configuration.userContentController.addUserScript(
      WKUserScript(
        source: "(function(){var md=navigator.mediaDevices;if(md&&md.getUserMedia){var g=md.getUserMedia.bind(md);md.getUserMedia=function(c){try{if(c&&c.video&&typeof c.video==='object'){c.video.width={ideal:1280};c.video.height={ideal:720};c.video.frameRate={ideal:30,max:30};}}catch(e){}return g(c).then(function(st){window.__gleameCam=st;return st;});};}window.__gleameSetSource=function(url){try{var v=document.getElementById('video');if(!v)return;if(window.__gleameModelTimer){cancelAnimationFrame(window.__gleameModelTimer);window.__gleameModelTimer=null;}if(!url){if(window.__gleameCam){v.srcObject=window.__gleameCam;v.play();}return;}var img=new Image();img.crossOrigin='anonymous';img.onload=function(){var c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;var cx=c.getContext('2d');var draw=function(){cx.drawImage(img,0,0,c.width,c.height);window.__gleameModelTimer=requestAnimationFrame(draw);};draw();try{v.srcObject=c.captureStream(30);v.play();}catch(e){window.webkit.messageHandlers.gleame.postMessage('modelerror: '+e);}};img.onerror=function(){window.webkit.messageHandlers.gleame.postMessage('modelerror: load failed');};img.src=url;}catch(e){}};window.__gleameScale=function(w,h){try{var v=document.getElementById('video');var t=v&&v.srcObject&&v.srcObject.getVideoTracks&&v.srcObject.getVideoTracks()[0];if(t&&t.applyConstraints)t.applyConstraints({width:{ideal:w},height:{ideal:h},frameRate:{ideal:30,max:30}});}catch(e){}};function post(k,m){try{window.webkit.messageHandlers.gleame.postMessage(k+': '+m);}catch(e){}}['error','warn'].forEach(function(k){var o=console[k];console[k]=function(){post(k,Array.prototype.join.call(arguments,' '));o.apply(console,arguments);};});window.addEventListener('error',function(e){post('jserror',e.message);});setInterval(function(){var f=document.getElementById('fps');var c=document.getElementById('canvas');post('stat',(f?f.textContent:'?')+' canvas='+(c?c.width+'x'+c.height:'?'));},4000);})();",
        injectionTime: .atDocumentStart,
        forMainFrameOnly: true
      )
    )
    configuration.userContentController.addUserScript(
      WKUserScript(
        source: "(function(){var c=document.createElement('style');c.textContent='.top-strip,.start-panel,#startPanel,#status,#fps{display:none!important}html,body,#phone-app,.phone-shell{margin:0!important;padding:0!important;width:100%!important;height:100%!important;background:#000!important;overflow:hidden!important}#canvas{width:100%!important;height:100%!important;display:block!important}';(document.head||document.documentElement).appendChild(c);var n=0,t=setInterval(function(){n++;var s=document.getElementById('startButton');if(s&&!s.disabled)s.click();var f=document.getElementById('filterToggle');if(f&&f.getAttribute('aria-pressed')!=='true')f.click();var k=document.getElementById('canvas');if((k&&k.width>0&&s&&s.disabled)||n>60)clearInterval(t);},500);})();",
        injectionTime: .atDocumentEnd,
        forMainFrameOnly: true
      )
    )
    webView = WKWebView(frame: frame, configuration: configuration)
    webView.isOpaque = false
    webView.backgroundColor = .black
    webView.scrollView.isScrollEnabled = false
    webView.scrollView.contentInsetAdjustmentBehavior = .never

    channel = FlutterMethodChannel(
      name: "tryon_studio_web/view/\(viewId)",
      binaryMessenger: messenger
    )
    super.init()
    webView.uiDelegate = self
    webView.navigationDelegate = self
    configuration.userContentController.add(self, name: "gleame")

    channel.setMethodCallHandler { [weak self] call, result in
      guard let self else { result(nil); return }
      switch call.method {
      case "setSource":
        let url = (call.arguments as? [String: Any])?["url"] as? String
        let arg = url.map { "'\($0)'" } ?? "null"
        self.webView.evaluateJavaScript(
          "window.__gleameSetSource && window.__gleameSetSource(\(arg))",
          completionHandler: nil
        )
        result(nil)
      case "setPayload":
        if let json = call.arguments as? String {
          TryOnStudioPreviewServer.shared.update(payload: Data(json.utf8))
        }
        result(nil)
      case "setBefore":
        let on = (call.arguments as? [String: Any])?["enabled"] as? Bool ?? false
        let want = on ? "false" : "true"
        self.webView.evaluateJavaScript(
          "(function(){var b=document.getElementById('filterToggle');"
            + "if(b&&b.getAttribute('aria-pressed')!=='\(want)')b.click();})()",
          completionHandler: nil
        )
        result(nil)
      case "capture":
        self.capture(result)
      case "stop":
        self.webView.loadHTMLString("<body style=\"background:#000\"></body>", baseURL: nil)
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }

    let params = args as? [String: Any] ?? [:]
    let rendererAsset = params["rendererRoot"] as? String ?? ""
    if let payload = params["payload"] as? String {
      TryOnStudioPreviewServer.shared.update(payload: Data(payload.utf8))
    }

    guard
      let indexPath = flutterAssetPath("\(rendererAsset)/phone-preview.html", registrar: registrar)
    else {
      channel.invokeMethod("error", arguments: "TryOn Studio renderer assets are missing.")
      return
    }
    let root = (indexPath as NSString).deletingLastPathComponent

    do {
      let port = try TryOnStudioPreviewServer.shared.start(root: root)
      let url = URL(string: "http://127.0.0.1:\(port)/phone-preview.html")!
      webView.load(URLRequest(url: url))
    } catch {
      channel.invokeMethod("error", arguments: error.localizedDescription)
    }
  }

  func view() -> UIView { webView }

  // The preview page waits for a tap before opening the camera; the app has
  // already taken the camera permission, so start it automatically.
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    guard !didSignalReady else { return }
    didSignalReady = true
    channel.invokeMethod("ready", arguments: nil)
  }

  func webView(
    _ webView: WKWebView,
    didFail navigation: WKNavigation!,
    withError error: Error
  ) {
    channel.invokeMethod("error", arguments: error.localizedDescription)
  }

  @available(iOS 15.0, *)
  func webView(
    _ webView: WKWebView,
    requestMediaCapturePermissionFor origin: WKSecurityOrigin,
    initiatedByFrame frame: WKFrameInfo,
    type: WKMediaCaptureType,
    decisionHandler: @escaping (WKPermissionDecision) -> Void
  ) {
    decisionHandler(.grant)
  }

  func userContentController(
    _ controller: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    print("[tryon-studio] \(message.body)")
  }

  private func capture(_ result: @escaping FlutterResult) {
    let config = WKSnapshotConfiguration()
    config.rect = webView.bounds
    webView.takeSnapshot(with: config) { image, _ in
      result(image?.pngData())
    }
  }
}

// MARK: - Native Google Sign-In
//
// Google refuses OAuth inside an embedded WebView, and Firebase's redirect flow
// loses its pending marker when WKWebView drops sessionStorage across the
// cross-origin round trip. Running the flow in ASWebAuthenticationSession is
// the path Google sanctions: it uses Safari's own session, so the account
// chooser appears, and it hands back an ID token the web page can sign in with.

import AuthenticationServices
import CryptoKit

final class GoogleSignInBridge: NSObject, ASWebAuthenticationPresentationContextProviding {
  static let shared = GoogleSignInBridge()

  private static let clientId =
    "729820542986-mmfg9f6bs4flhng0vtjh0l5lfbiok535.apps.googleusercontent.com"
  private static let redirectScheme =
    "com.googleusercontent.apps.729820542986-mmfg9f6bs4flhng0vtjh0l5lfbiok535"

  private var session: ASWebAuthenticationSession?

  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.keyWindow }
      .first ?? ASPresentationAnchor()
  }

  /// Runs the whole flow and returns Google's ID token.
  func signIn(completion: @escaping (Result<String, Error>) -> Void) {
    let verifier = Self.randomVerifier()
    let challenge = Self.challenge(for: verifier)
    let redirectUri = "\(Self.redirectScheme):/oauth2redirect"

    var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
    components.queryItems = [
      URLQueryItem(name: "client_id", value: Self.clientId),
      URLQueryItem(name: "redirect_uri", value: redirectUri),
      URLQueryItem(name: "response_type", value: "code"),
      URLQueryItem(name: "scope", value: "openid email profile"),
      URLQueryItem(name: "code_challenge", value: challenge),
      URLQueryItem(name: "code_challenge_method", value: "S256"),
      // Always offer the account list rather than reusing one silently.
      URLQueryItem(name: "prompt", value: "select_account")
    ]

    let session = ASWebAuthenticationSession(
      url: components.url!,
      callbackURLScheme: Self.redirectScheme
    ) { callbackURL, error in
      if let error {
        completion(.failure(error))
        return
      }
      guard
        let callbackURL,
        let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
          .queryItems?.first(where: { $0.name == "code" })?.value
      else {
        completion(.failure(NSError(
          domain: "GoogleSignIn", code: -1,
          userInfo: [NSLocalizedDescriptionKey: "No authorization code returned."]
        )))
        return
      }
      Self.exchange(code: code, verifier: verifier, redirectUri: redirectUri, completion: completion)
    }
    session.presentationContextProvider = self
    // Use Safari's session so the user's existing Google accounts are listed.
    session.prefersEphemeralWebBrowserSession = false
    self.session = session
    session.start()
  }

  private static func exchange(
    code: String,
    verifier: String,
    redirectUri: String,
    completion: @escaping (Result<String, Error>) -> Void
  ) {
    var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    // Installed apps use PKCE and carry no client secret.
    let body = [
      "client_id=\(clientId)",
      "code=\(code)",
      "code_verifier=\(verifier)",
      "grant_type=authorization_code",
      "redirect_uri=\(redirectUri)"
    ].joined(separator: "&")
    request.httpBody = body.data(using: .utf8)

    URLSession.shared.dataTask(with: request) { data, _, error in
      if let error {
        completion(.failure(error))
        return
      }
      guard
        let data,
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let idToken = json["id_token"] as? String
      else {
        let detail = data.flatMap { String(data: $0, encoding: .utf8) } ?? "no body"
        completion(.failure(NSError(
          domain: "GoogleSignIn", code: -2,
          userInfo: [NSLocalizedDescriptionKey: "Token exchange failed: \(detail)"]
        )))
        return
      }
      completion(.success(idToken))
    }.resume()
  }

  private static func randomVerifier() -> String {
    var bytes = [UInt8](repeating: 0, count: 64)
    _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    return Data(bytes).base64URLEncoded()
  }

  private static func challenge(for verifier: String) -> String {
    Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncoded()
  }
}

private extension Data {
  func base64URLEncoded() -> String {
    base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}
