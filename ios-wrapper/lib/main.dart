import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:ui' as ui;

import 'package:deepar_flutter_plus/deepar_flutter_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GleameApp());
}

class GleameApp extends StatelessWidget {
  const GleameApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Gleame',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: Colors.black,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xffff3f87),
          brightness: Brightness.dark,
        ),
      ),
      home: const LookLabPage(),
    );
  }
}

enum LabTab { tryLooks, build, home, lab }

class LookLabPage extends StatefulWidget {
  const LookLabPage({super.key});

  @override
  State<LookLabPage> createState() => _LookLabPageState();
}

class _LookLabPageState extends State<LookLabPage> {
  static const _pink = Color(0xffff3f87);
  static const _berry = Color(0xff8f2a50);
  static const _panel = Color(0xd9111111);
  static const _sfSymbolsChannel = MethodChannel('gleame/sf_symbols');
  static const _iosDeepArKey =
      'cea1c575f20ba165fe73308381a71a6a7ed091a4c5c932f6630662002a33acb5bd7df298ee83b14a2';
  static const _liveWebBaseUrl = 'https://tryon-beauty.ai.studio';
  static const _debugWebBaseUrl = 'http://127.0.0.1:3000';
  static const _webBaseUrl = String.fromEnvironment(
    'GLEAME_WEB_BASE_URL',
    defaultValue: kReleaseMode ? _liveWebBaseUrl : _debugWebBaseUrl,
  );
  static Uri _embeddedWebUri(String path) =>
      Uri.parse('$_webBaseUrl$path?embedded=ios');
  static final Uri _webHomeUri = _embeddedWebUri('/home');
  static final Uri _webLookLabUri = _embeddedWebUri('/gallery');
  static const _tryOnStudioModelAsset =
      'assets/tryonstudio_native/face_landmarker.task';
  static const _tryOnStudioCatalogAsset = 'assets/tryonstudio_catalog.json';
  static const _tryOnStudioRendererRoot = 'assets/tryonstudio_renderer';

  final DeepArControllerPlus _deepArController = DeepArControllerPlus();
  final WebViewController _homeWebController = WebViewController();
  final WebViewController _lookLabWebController = WebViewController();
  final Set<String> _favoritePresetNames = {};
  final Map<String, Uint8List> _sfSymbolPngs = {};
  MethodChannel? _tryOnStudioNativeChannel;
  String? _activeTryOnStudioAsset;

  LabTab _tab = LabTab.home;
  bool _arInitialized = false;
  bool _arViewCreated = false;
  bool _savingCapture = false;
  bool _cameraDenied = false;
  bool _homeWebReady = false;
  bool _lookLabWebReady = false;
  bool _looksPortalOpen = false;
  bool _sheerSkin = false;
  bool _beforeAfter = false;
  bool _tryOnStudioRendererActive = false;
  bool _tryOnStudioReady = false;
  double _brightness = 0.10;
  String? _tryOnStudioStatus;
  Future<void> _effectQueue = Future<void>.value();
  final Map<String, Timer> _slotDebounceTimers = {};
  final Map<String, String> _activeSlotPaths = {};
  final ScrollController _shadeController = ScrollController();
  static const double _swatchExtent = 56;
  Timer? _shadeApplyTimer;
  int _tryOnStudioViewSerial = 0;
  int _groupIndex = 0;
  int _presetIndex = 0;
  int _eyeshadowIndex = 0;
  int _eyelinerIndex = 0;
  int _lashIndex = 0;
  int _lipIndex = 0;

  /// Full-face DeepAR looks. They stay available as their own category
  /// alongside the TryOn Studio lip packages loaded from the catalog.
  static const List<LookItem> _studioLooks = [
    LookItem('Natural', 'effects/look_natural/naturalnolashes.deepar'),
    LookItem('Glam', 'effects/look_glam/smokey_eye_look.deepar'),
    LookItem(
      'Purple Glam',
      'effects/look_soft_pink/purpleeyeshadowlook.deepar',
    ),
    LookItem('Bronzed', 'effects/look_bronzed/brownlook.deepar'),
    LookItem('Pink Liner', 'effects/Pink_liner/pinklinerlook.deepar'),
    LookItem('Golden Ombre', 'effects/Golden_ombre/goldenombrelook.deepar'),
    LookItem('Electric Blue', 'effects/electricblue/darkblueeyes.deepar'),
    LookItem('Ombre Glitter', 'effects/ombre_glitter/sparkleombre.deepar'),
    LookItem('Olive', 'effects/olive/olive.deepar'),
    LookItem('Soft Blue', 'effects/softblueparty/softblue.deepar'),
    LookItem(
      'Baby Pink',
      'effects/babypinkglam/babypinklashesandlinerblack.deepar',
    ),
    LookItem('Peach', 'effects/peach/peach.deepar'),
    LookItem('Brown Ombre', 'effects/brownombre/BrownOmbre.deepar'),
    LookItem('Matte Black', 'effects/matteblack/Matteblack.deepar'),
    LookItem('Classic Ombre', 'effects/classicombre/classicombre.deepar'),
    LookItem('Soft Gold', 'effects/softgold/softgold.deepar'),
    LookItem('White Snow', 'effects/whitesnow/whitesnow.deepar'),
    LookItem('Champagne', 'effects/glitterchampagne/champagne.deepar'),
    LookItem('Gold Glitter', 'effects/goldglitter/goldglitter.deepar'),
    LookItem('Jet Black', 'effects/jetblack/jetcatblack.deepar'),
    LookItem('Feather Black', 'effects/featherblack/featherblack.deepar'),
    LookItem('Cat Brown', 'effects/catbrown/catbrown.deepar'),
  ];

  static const LookCategory _studioLookCategory = LookCategory(
    key: 'studio_looks',
    label: 'Studio Looks',
    section: 'Looks',
    items: _studioLooks,
  );

  static const LookCategory _loadingCategory = LookCategory(
    key: 'loading',
    label: 'Loading shades',
    section: 'Filters',
    items: <LookItem>[],
  );

  /// The DeepAR looks stay bundled under effects/, they are just not offered
  /// in the picker any more. Set this to true to bring the category back.
  final bool _showStudioLooks = false;

  /// Filled in once assets/tryonstudio_catalog.json has been read.
  List<LookCategory> _categories = const <LookCategory>[];

  LookCategory get _currentCategory =>
      _categories.isEmpty
          ? _loadingCategory
          : _categories[_groupIndex.clamp(0, _categories.length - 1)];

  List<LookItem> get _presets => _currentCategory.items;

  LookItem get _currentLook {
    final looks = _presets;
    if (looks.isEmpty) return const LookItem('None', '');
    return looks[_presetIndex.clamp(0, looks.length - 1)];
  }

  final List<LookItem> _eyeshadows = const [
    LookItem('None', ''),
    LookItem('Aqua', 'effects/eyeshadows/aquaeyes.deepar'),
    LookItem('Baby Blue', 'effects/eyeshadows/babyblueeyes.deepar'),
    LookItem('Beige', 'effects/eyeshadows/beigeeyes.deepar'),
    LookItem('Brown Ombre', 'effects/eyeshadows/brownombreeyeshadow.deepar'),
    LookItem('Dark Blue', 'effects/eyeshadows/darkblueeyeshadow.deepar'),
    LookItem('Dark Purple', 'effects/eyeshadows/darkpurpleeyes.deepar'),
    LookItem('Deep Brown', 'effects/eyeshadows/deepbrowneyes.deepar'),
    LookItem('Gold Ombre', 'effects/eyeshadows/goldombreeyeshadow.deepar'),
    LookItem('Hot Pink', 'effects/eyeshadows/hotpinkeyes.deepar'),
    LookItem('Jet Black', 'effects/eyeshadows/jetblackfulleyeshadow.deepar'),
    LookItem('Lavender', 'effects/eyeshadows/lavendereyes.deepar'),
    LookItem('Light Pink', 'effects/eyeshadows/lightpinkeyes.deepar'),
    LookItem('Olive', 'effects/eyeshadows/oliveeyeshadow.deepar'),
    LookItem('Peach', 'effects/eyeshadows/peacheyeshadow.deepar'),
    LookItem('Soft Blue', 'effects/eyeshadows/softblueeyes.deepar'),
    LookItem('Sparkle Ombre', 'effects/eyeshadows/sparkleombre.deepar'),
    LookItem('White Pink', 'effects/eyeshadows/whitepinkeyes.deepar'),
  ];

  final List<LookItem> _eyeliners = const [
    LookItem('None', ''),
    LookItem('Cat Liner', 'effects/eyeliner/catliner.deepar'),
    LookItem('Small Wing', 'effects/eyeliner/smallthinwing.deepar'),
    LookItem('Thick Liner', 'effects/eyeliner/thickeyelinernowing.deepar'),
    LookItem('Thin Liner', 'effects/eyeliner/thinlinernowing.deepar'),
    LookItem('Winged Heavy', 'effects/eyeliner/wingedheavy.deepar'),
  ];

  final List<LookItem> _lashes = const [
    LookItem('None', ''),
    LookItem('Feather', 'effects/eyelashes/featherlashes.deepar'),
    LookItem('Fluffy Cat', 'effects/eyelashes/fluffycatlashes.deepar'),
    LookItem('Glam', 'effects/eyelashes/glamlashes.deepar'),
    LookItem('Lash Lift', 'effects/eyelashes/lashliftlashes.deepar'),
    LookItem('Natural Short', 'effects/eyelashes/naturalshortlashes.deepar'),
  ];

  final List<LookItem> _lips = const [
    LookItem('None', ''),
    LookItem('Cherry Red', ''),
    LookItem('Rose Nude', ''),
    LookItem('Berry', ''),
    LookItem('Peach Gloss', ''),
    LookItem('Brown Nude', ''),
  ];

  @override
  void initState() {
    super.initState();
    _configureWebControllers();
    unawaited(_loadSfSymbols());
    unawaited(_loadSavedState());
    unawaited(_loadFilterCatalog());
  }

  Future<void> _loadSfSymbols() async {
    const symbols = [
      'safari',
      'door.french.closed',
      'door.french.open',
      'square.stack.3d.up',
      'camera.filters',
      'paintpalette',
    ];
    final loaded = <String, Uint8List>{};

    for (final name in symbols) {
      try {
        final bytes = await _sfSymbolsChannel.invokeMethod<Uint8List>(
          'render',
          {'name': name, 'pointSize': 34.0, 'weight': 'semibold'},
        );
        if (bytes != null && bytes.isNotEmpty) loaded[name] = bytes;
      } catch (e, st) {
        log('SF Symbol load failed for $name: $e', stackTrace: st);
      }
    }

    if (!mounted || loaded.isEmpty) return;
    setState(() => _sfSymbolPngs.addAll(loaded));
  }

  void _configureWebControllers() {
    _configureWebController(
      controller: _homeWebController,
      uri: _webHomeUri,
      onLoaded: () {
        if (!mounted) return;
        setState(() => _homeWebReady = true);
      },
    );
    _configureWebController(
      controller: _lookLabWebController,
      uri: _webLookLabUri,
      onLoaded: () {
        if (!mounted) return;
        setState(() => _lookLabWebReady = true);
      },
    );
  }

  void _configureWebController({
    required WebViewController controller,
    required Uri uri,
    required VoidCallback onLoaded,
  }) {
    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'GleameBridge',
        onMessageReceived: (message) {
          log('Gleame web bridge: ${message.message}');
          try {
            final decoded = jsonDecode(message.message) as Map<String, dynamic>;
            final type = decoded['type'] as String?;
            final target = decoded['target'] as String?;
            if (type == 'gleame:navigate-native') {
              unawaited(_handleWebNavigation(target));
              return;
            }
            final status = decoded['message'] as String?;
            if (status != null && mounted) _snack(status);
          } catch (_) {
            if (mounted) _snack(message.message);
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => onLoaded(),
          onWebResourceError: (error) {
            log(
              'Gleame web page error ${error.errorCode}: ${error.description}',
            );
          },
        ),
      )
      ..loadRequest(uri);
  }

  String? _activeTryOnStudioPayload;

  Future<void> _openTryOnStudioRenderer(LookItem item) async {
    final cameraStatus = await Permission.camera.request();
    if (!cameraStatus.isGranted) {
      if (mounted) setState(() => _cameraDenied = true);
      throw StateError('Camera permission denied');
    }

    await _releaseDeepArForTryOnStudio();

    if (!mounted) return;
    setState(() {
      _activeTryOnStudioAsset = item.assetPath;
      _tryOnStudioNativeChannel = null;
      _tryOnStudioRendererActive = true;
      _tryOnStudioReady = false;
      _tryOnStudioStatus = 'Starting native TryOn Studio renderer...';
      _arViewCreated = false;
      _tryOnStudioViewSerial++;
    });
  }

  Future<void> _releaseDeepArForTryOnStudio() async {
    if (!_arInitialized && !_arViewCreated) return;
    if (mounted) {
      setState(() {
        _arInitialized = false;
        _arViewCreated = false;
      });
    }
    await _deepArController.destroy();
    _activeSlotPaths.removeWhere((slot, _) => slot != 'tryonstudio');
    await Future<void>.delayed(const Duration(milliseconds: 650));
  }

  Future<void> _ensureDeepArForNativeLooks() async {
    if (_arInitialized || _cameraDenied) return;
    await _initializeDeepAr();
  }

  Future<void> _closeTryOnStudioRenderer() async {
    try {
      await _tryOnStudioNativeChannel?.invokeMethod<void>('stop');
    } catch (e, st) {
      log('TryOn Studio renderer stop failed: $e', stackTrace: st);
    }

    if (!mounted) return;
    setState(() {
      _tryOnStudioRendererActive = false;
      _tryOnStudioReady = false;
      _tryOnStudioStatus = null;
      _activeTryOnStudioAsset = null;
      _tryOnStudioNativeChannel = null;
    });
  }

  Future<void> _setTryOnStudioBefore(bool enabled) async {
    try {
      await _tryOnStudioNativeChannel?.invokeMethod<void>(
        'setBefore',
        <String, Object?>{'enabled': enabled},
      );
    } catch (e, st) {
      log('TryOn Studio before toggle failed: $e', stackTrace: st);
    }
  }

  void _onTryOnStudioViewCreated(int viewId) {
    final channel = MethodChannel('tryon_studio_web/view/$viewId');
    channel.setMethodCallHandler((call) async {
      if (!mounted) return null;
      if (call.method == 'ready') {
        setState(() {
          _tryOnStudioReady = true;
          _tryOnStudioStatus = null;
        });
        return null;
      }
      if (call.method == 'error') {
        final message = call.arguments?.toString();
        setState(() {
          _tryOnStudioReady = false;
          _tryOnStudioStatus = message ?? 'TryOn Studio renderer failed.';
        });
        _snack(_tryOnStudioStatus!);
        return null;
      }
      return null;
    });
    setState(() => _tryOnStudioNativeChannel = channel);
  }

  Future<void> _handleWebNavigation(String? target) async {
    if (target == 'try') {
      await _switchTab(LabTab.tryLooks);
      return;
    }

    if (target == 'build') {
      await _switchTab(LabTab.build);
      return;
    }

    if (target == 'home') {
      await _closeTryOnStudioRenderer();
      if (!mounted) return;
      setState(() {
        _tab = LabTab.home;
        _looksPortalOpen = false;
      });
      return;
    }

    if (target == 'lab') {
      await _closeTryOnStudioRenderer();
      if (!mounted) return;
      setState(() {
        _tab = LabTab.lab;
        _looksPortalOpen = false;
      });
      return;
    }

    final path = switch (target) {
      'sandbox' => '/editor',
      'gallery' => '/gallery',
      'hall-of-fame' => '/legends',
      'trending' => '/trending',
      'built-looks' => '/presets',
      'votes' => '/votes',
      'profile' => '/profile',
      _ => null,
    };

    if (path == null) return;
    await _openLookLabPath(path);
  }

  Future<void> _openLookLabPath(String path) async {
    if (!mounted) return;
    setState(() {
      _tab = LabTab.lab;
      _looksPortalOpen = false;
    });

    final pathWithQuery = '$path?embedded=ios';
    final script = '''
(() => {
  window.history.pushState(null, '', ${jsonEncode(pathWithQuery)});
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
})();
''';

    if (_lookLabWebReady) {
      try {
        await _lookLabWebController.runJavaScript(script);
        return;
      } catch (e, st) {
        log('Look Lab JS navigation failed: $e', stackTrace: st);
      }
    }

    if (mounted) setState(() => _lookLabWebReady = false);
    await _lookLabWebController.loadRequest(_embeddedWebUri(path));
  }

  /// Reads assets/tryonstudio_catalog.json, which the packaging step writes
  /// alongside the flattened .tryonfilter assets.
  Future<void> _loadFilterCatalog() async {
    try {
      final raw = await rootBundle.loadString(_tryOnStudioCatalogAsset);
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final items = (data['items'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList();
      final groups = (data['groups'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList();

      final categories = <LookCategory>[];
      for (final group in groups) {
        final key = group['key'] as String?;
        if (key == null) continue;
        final looks = items
            .where((item) => item['group'] == key)
            .map(LookItem.fromCatalog)
            .where((look) => look.assetPath.isNotEmpty)
            .toList();
        if (looks.isEmpty) continue;
        categories.add(
          LookCategory(
            key: key,
            label: group['label'] as String? ?? key,
            section: group['section'] as String? ?? 'Filters',
            items: looks,
          ),
        );
      }
      if (_showStudioLooks) categories.add(_studioLookCategory);

      if (!mounted || categories.isEmpty) return;
      setState(() {
        _categories = categories;
        _groupIndex = 0;
        _presetIndex = 0;
      });
      log('Loaded ${categories.length} filter categories');
    } catch (e, st) {
      log('Filter catalog failed to load: $e', stackTrace: st);
    }
  }

  Future<void> _loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = prefs.getStringList('favorite_presets') ?? const [];
    if (!mounted) return;
    setState(() => _favoritePresetNames.addAll(favorites));
  }

  Future<void> _initializeDeepAr() async {
    try {
      final cameraStatus = await Permission.camera.request();
      if (!cameraStatus.isGranted) {
        if (!mounted) return;
        setState(() => _cameraDenied = true);
        return;
      }

      final result = await _deepArController.initialize(
        androidLicenseKey: null,
        iosLicenseKey: _iosDeepArKey,
        resolution: Resolution.high,
      );
      log('DeepAR initialize: ${result.success} ${result.message}');
      if (!mounted) return;
      setState(() => _arInitialized = result.success);
    } catch (e, st) {
      log('DeepAR initialize failed: $e', stackTrace: st);
      if (!mounted) return;
      setState(() {
        _arInitialized = false;
        _cameraDenied = false;
      });
    }
  }

  @override
  void dispose() {
    for (final timer in _slotDebounceTimers.values) {
      timer.cancel();
    }
    _shadeApplyTimer?.cancel();
    _shadeController.dispose();
    unawaited(_tryOnStudioNativeChannel?.invokeMethod<void>('stop'));
    unawaited(_deepArController.destroy());
    super.dispose();
  }

  Future<void> _applyPreset(int index) async {
    final looks = _presets;
    if (looks.isEmpty) return;
    final safeIndex = index.clamp(0, looks.length - 1);
    setState(() => _presetIndex = safeIndex);
    final item = looks[safeIndex];
    if (item.isTryOnStudio) {
      await _applyTryOnStudioPreset(item);
      return;
    }

    await _closeTryOnStudioRenderer();
    _activeSlotPaths.remove('tryonstudio');
    await _ensureDeepArForNativeLooks();
    await _runEffect(() async {
      await _clearSlots(const [
        'eyeshadow',
        'eyeliner',
        'eyelashes',
        'lips',
        'sheerskin',
      ]);
      final assetPath = item.assetPath;
      await _deepArController.switchEffect(assetPath);
      _activeSlotPaths['effect'] = assetPath;
      log('Applied preset ${item.name}: $assetPath');
    });
  }

  /// Turns a .tryonfilter into the payload TryOn Studio's preview page reads.
  ///
  /// The page resolves texture paths against the server origin, so anything the
  /// bundle actually serves (/assets/effect-house/...) is left alone, while
  /// paths that only exist inside Studio (/user-assets/...) are swapped for the
  /// texture embedded in the filter itself.
  String _previewPayload(Map<String, dynamic> filter, LookItem item) {
    final embedded = <String, String>{};
    for (final asset in (filter['assets'] as List? ?? const [])) {
      if (asset is! Map) continue;
      final region = asset['region'];
      final dataUrl = asset['dataUrl'];
      if (region is String && dataUrl is String && dataUrl.startsWith('data:')) {
        embedded[region] = dataUrl;
      }
    }

    String? resolve(Object? path, String region) {
      if (path is! String || path.isEmpty) return path as String?;
      if (path.startsWith('data:') || path.startsWith('/assets/')) return path;
      return embedded[region] ?? path;
    }

    final payload = Map<String, dynamic>.from(filter);
    final look = Map<String, dynamic>.from(payload['look'] as Map? ?? {});
    final textures = Map<String, dynamic>.from(look['textures'] as Map? ?? {});
    for (final region in textures.keys.toList()) {
      textures[region] = resolve(textures[region], region);
    }
    look['textures'] = textures;
    payload['look'] = look;

    final eyeControls = payload['eyeControls'];
    if (eyeControls is Map) {
      final eyes = Map<String, dynamic>.from(eyeControls);
      eyes['baseTexture'] = resolve(eyes['baseTexture'], 'eyes');
      eyes['shimmerTexture'] = resolve(eyes['shimmerTexture'], 'glitter');
      payload['eyeControls'] = eyes;
    }
    final lipControls = payload['lipControls'];
    if (lipControls is Map) {
      final lips = Map<String, dynamic>.from(lipControls);
      lips['glossTexture'] = resolve(lips['glossTexture'], 'lipgloss');
      lips['shimmerTexture'] = resolve(lips['shimmerTexture'], 'lipshimmer');
      payload['lipControls'] = lips;
    }

    // Studio's payload calls this `lighting`; the saved filter calls it
    // `lightingControls`.
    payload['lighting'] ??= payload['lightingControls'];

    // Swatch packs share one filter; the shade only moves colour, strength and
    // finish, so the render path stays exactly the one Studio saved.
    final shade = item.shade;
    if (shade != null) {
      final region = shade['region'] as String? ?? 'lips';
      final palette = Map<String, dynamic>.from(look['palette'] as Map? ?? {});
      final intensity = Map<String, dynamic>.from(look['intensity'] as Map? ?? {});
      final layers = Map<String, dynamic>.from(payload['layers'] as Map? ?? {});
      palette[region] = shade['colour'];
      intensity[region] = shade['opacity'];
      layers[region] = true;
      look['palette'] = palette;
      look['intensity'] = intensity;
      look['name'] = item.name;
      payload['layers'] = layers;
      payload['look'] = look;
      if (region == 'lips') {
        final lips = Map<String, dynamic>.from(payload['lipControls'] as Map? ?? {});
        lips['finish'] = shade['finish'];
        payload['lipControls'] = lips;
      }
    }
    return jsonEncode(payload);
  }

  Future<void> _applyTryOnStudioPreset(
    LookItem item, {
    bool showMessage = true,
  }) async {
    try {
      final filterData =
          jsonDecode(await rootBundle.loadString(item.assetPath))
              as Map<String, dynamic>;
      final schema = filterData['schema'];
      final format = filterData['format'];
      if (schema != 'tryonstudio.filter.v1' || format != 'tryonfilter-json') {
        throw const FormatException('Unsupported TryOnStudio filter format.');
      }

      final payload = _previewPayload(filterData, item);
      _activeTryOnStudioPayload = payload;

      final live = _tryOnStudioNativeChannel;
      if (_tryOnStudioRendererActive && live != null) {
        // Renderer already running: hand it the new look, no camera restart.
        await live.invokeMethod<void>('setPayload', payload);
        _activeSlotPaths['tryonstudio'] = item.assetPath;
        if (mounted) {
          setState(() => _activeTryOnStudioAsset = item.assetPath);
        }
        return;
      }

      await _closeTryOnStudioRenderer();
      _activeSlotPaths.remove('tryonstudio');
      await _runEffect(() async {
        await _clearSlots(const [
          'effect',
          'eyeshadow',
          'eyeliner',
          'eyelashes',
          'lips',
          'sheerskin',
        ]);
        log('Loaded TryOnStudio preset ${item.name}: ${item.assetPath}');
      });
      await _openTryOnStudioRenderer(item);
      _activeSlotPaths['tryonstudio'] = item.assetPath;

      if (mounted && showMessage) {
        _snack('Imported ${item.name}');
      }
    } catch (e, st) {
      log('TryOnStudio preset failed to load: $e', stackTrace: st);
      if (mounted) {
        _snack(
          e is StateError && e.message == 'Camera permission denied'
              ? 'Camera permission denied.'
              : 'This custom filter could not be read.',
        );
      }
    }
  }

  void _selectCategory(int index) {
    if (index < 0 || index >= _categories.length || index == _groupIndex) {
      return;
    }
    setState(() {
      _groupIndex = index;
      _presetIndex = 0;
    });
    _syncShadeController(0);
    _shadeApplyTimer?.cancel();
    unawaited(_applyPreset(0));
  }

  void _selectShade(int index) {
    if (index == _presetIndex) return;
    _shadeApplyTimer?.cancel();
    if (_shadeController.hasClients) {
      final target = (index * _swatchExtent) - 120;
      unawaited(
        _shadeController.animateTo(
          target.clamp(0.0, _shadeController.position.maxScrollExtent),
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        ),
      );
    }
    unawaited(_applyPreset(index));
  }

  void _syncShadeController(int index) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_shadeController.hasClients) return;
      final target = (index * _swatchExtent) - 120;
      _shadeController.jumpTo(
        target.clamp(0.0, _shadeController.position.maxScrollExtent),
      );
    });
  }

  Future<void> _toggleFavoritePreset() async {
    final name = _currentLook.name;
    setState(() {
      if (!_favoritePresetNames.remove(name)) {
        _favoritePresetNames.add(name);
      }
    });

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      'favorite_presets',
      _favoritePresetNames.toList()..sort(),
    );
    _snack(
      _favoritePresetNames.contains(name) ? 'Saved $name' : 'Removed $name',
    );
  }

  Future<void> _saveBuildLook() async {
    final prefs = await SharedPreferences.getInstance();
    final look = _buildLookName();
    final savedLooks = prefs.getStringList('saved_build_looks') ?? <String>[];
    savedLooks.add(look);
    await prefs.setStringList('saved_build_looks', savedLooks);
    unawaited(_sendBuildLookToWeb('gleame:save-built-look'));
    _snack('Build look saved');
  }

  String _buildLookName() {
    final selected =
        [
          _eyeshadows[_eyeshadowIndex].name,
          _eyeliners[_eyelinerIndex].name,
          _lashes[_lashIndex].name,
          _lips[_lipIndex].name,
        ].where((name) => name != 'None').toList();

    return selected.isEmpty ? 'Clean Gleame Build' : selected.join(' + ');
  }

  Map<String, Object?> _buildLookPayload() {
    return {
      'lookName': _buildLookName(),
      'description': 'Built in the Gleame iOS try-on app.',
      'category': 'challenge',
      'source': 'gleame-ios-wrapper',
      'makeupConfig': {
        'eyes': _eyeshadows[_eyeshadowIndex].name,
        'liner': _eyeliners[_eyelinerIndex].name,
        'lashes': _lashes[_lashIndex].name,
        'lips': _lips[_lipIndex].name,
        'sheerSkin': _sheerSkin,
        'preset': _tab == LabTab.tryLooks ? _currentLook.name : null,
      },
    };
  }

  Future<void> _sendBuildLookToWeb(String type) async {
    final message = <String, Object?>{
      'source': 'gleame-ios-wrapper',
      'type': type,
      'payload': _buildLookPayload(),
    };
    final script =
        "window.dispatchEvent(new MessageEvent('message', { data: ${jsonEncode(message)} }));";

    try {
      await _lookLabWebController.runJavaScript(script);
      if (_homeWebReady) {
        await _homeWebController.runJavaScript(script);
      }
    } catch (e, st) {
      log('Web bridge send failed: $e', stackTrace: st);
      if (mounted) _snack('Open Look Lab to sync this look.');
    }
  }

  Future<void> _saveTryOnStudioCaptureToPhotos() async {
    final channel = _tryOnStudioNativeChannel;
    if (channel == null || !_tryOnStudioReady) {
      _snack('TryOn Studio camera is still starting.');
      return;
    }
    if (_savingCapture) return;

    setState(() => _savingCapture = true);
    try {
      final status = await Permission.photosAddOnly.request();
      if (!status.isGranted && !status.isLimited) {
        _snack('Photo permission denied.');
        return;
      }

      final bytes = await channel.invokeMethod<Uint8List>('capture');
      if (bytes == null || bytes.isEmpty) {
        throw const FormatException('Renderer did not return a PNG capture.');
      }
      final saveResult = await ImageGallerySaver.saveImage(
        bytes,
        quality: 100,
        name: 'tryon_beauty_${DateTime.now().millisecondsSinceEpoch}',
      );
      log('TryOn Studio ImageGallerySaver result: $saveResult');
      _snack('Saved to Photos');
    } catch (e, st) {
      log('TryOn Studio capture failed: $e', stackTrace: st);
      _snack('Capture failed.');
    } finally {
      if (mounted) setState(() => _savingCapture = false);
    }
  }

  Future<void> _saveCaptureToPhotos() async {
    if (_tryOnStudioRendererActive) {
      await _saveTryOnStudioCaptureToPhotos();
      return;
    }

    if (!_arInitialized || !_arViewCreated) {
      _snack('Camera is still starting.');
      return;
    }
    if (_savingCapture) return;

    setState(() => _savingCapture = true);
    try {
      final status = await Permission.photosAddOnly.request();
      if (!status.isGranted && !status.isLimited) {
        _snack('Photo permission denied.');
        return;
      }

      final file = await _deepArController.takeScreenshot();
      final result = await ImageGallerySaver.saveFile(
        file.path,
        name: 'tryon_beauty_${DateTime.now().millisecondsSinceEpoch}',
      );
      log('ImageGallerySaver result: $result');
      _snack('Saved to Photos');
    } catch (e, st) {
      log('Capture failed: $e', stackTrace: st);
      _snack('Capture failed.');
    } finally {
      if (mounted) setState(() => _savingCapture = false);
    }
  }

  Future<void> _applyBuildSlot(String slot, LookItem item) async {
    if (_tryOnStudioRendererActive) {
      await _closeTryOnStudioRenderer();
      _activeSlotPaths.remove('tryonstudio');
    }
    await _ensureDeepArForNativeLooks();
    await _runEffect(() async {
      await _deepArController.switchEffectWithSlot(
        slot: slot,
        path: item.assetPath,
      );
      if (item.assetPath.isEmpty) {
        _activeSlotPaths.remove(slot);
      } else {
        _activeSlotPaths[slot] = item.assetPath;
      }
      log('Applied slot $slot ${item.name}: ${item.assetPath}');
    });
  }

  Future<void> _runEffect(Future<void> Function() action) async {
    if (!_arInitialized || !_arViewCreated) return;
    final next = _effectQueue.catchError((_) {}).then((_) async {
      if (!_arInitialized || !_arViewCreated) return;
      try {
        await action();
      } catch (e, st) {
        log('DeepAR effect failed: $e', stackTrace: st);
        if (mounted) _snack('This effect could not load.');
      }
    });
    _effectQueue = next;
    await next;
  }

  void _changeBuildIndex(String type, int delta) {
    setState(() {
      if (type == 'shadow') {
        _eyeshadowIndex = _wrap(_eyeshadowIndex + delta, _eyeshadows.length);
      }
      if (type == 'liner') {
        _eyelinerIndex = _wrap(_eyelinerIndex + delta, _eyeliners.length);
      }
      if (type == 'lash') {
        _lashIndex = _wrap(_lashIndex + delta, _lashes.length);
      }
      if (type == 'lip') {
        _lipIndex = _wrap(_lipIndex + delta, _lips.length);
      }
    });
    if (type == 'shadow') {
      _debouncedBuildSlot('eyeshadow', _eyeshadows[_eyeshadowIndex]);
    }
    if (type == 'liner') {
      _debouncedBuildSlot('eyeliner', _eyeliners[_eyelinerIndex]);
    }
    if (type == 'lash') {
      _debouncedBuildSlot('eyelashes', _lashes[_lashIndex]);
    }
  }

  void _debouncedBuildSlot(String slot, LookItem item) {
    _slotDebounceTimers[slot]?.cancel();
    _slotDebounceTimers[slot] = Timer(
      const Duration(milliseconds: 120),
      () => unawaited(_applyBuildSlot(slot, item)),
    );
  }

  Future<void> _openCleanBuildTab() async {
    for (final timer in _slotDebounceTimers.values) {
      timer.cancel();
    }
    _slotDebounceTimers.clear();
    setState(() {
      _tab = LabTab.build;
      _looksPortalOpen = false;
      _beforeAfter = false;
      _eyeshadowIndex = 0;
      _eyelinerIndex = 0;
      _lashIndex = 0;
      _lipIndex = 0;
      _sheerSkin = false;
    });
    await _closeTryOnStudioRenderer();
    _activeSlotPaths.remove('tryonstudio');
    await _ensureDeepArForNativeLooks();
    await _runEffect(() async {
      await _clearSlots(const [
        'effect',
        'eyeshadow',
        'eyeliner',
        'eyelashes',
        'lips',
        'sheerskin',
      ]);
      log('Opened Build with clean effect slots');
    });
  }

  Future<void> _clearSlots(Iterable<String> slots) async {
    for (final slot in slots) {
      if (!_activeSlotPaths.containsKey(slot)) continue;
      if (slot == 'tryonstudio') {
        await _closeTryOnStudioRenderer();
        _activeSlotPaths.remove(slot);
        continue;
      }
      await _deepArController.switchEffectWithSlot(slot: slot, path: '');
      _activeSlotPaths.remove(slot);
    }
  }

  Future<void> _submitBuildChallenge() async {
    await _sendBuildLookToWeb('gleame:submit-challenge');
  }

  Future<void> _showBeforeLook() async {
    if (_beforeAfter) return;
    setState(() => _beforeAfter = true);
    if (_tryOnStudioRendererActive) {
      await _setTryOnStudioBefore(true);
      log('Before preview enabled for TryOn Studio renderer');
      return;
    }
    await _runEffect(() async {
      await _clearSlots(_activeSlotPaths.keys.toList());
      log('Before preview enabled');
    });
  }

  Future<void> _restoreCurrentLook() async {
    if (!_beforeAfter) return;
    setState(() => _beforeAfter = false);
    if (_tryOnStudioRendererActive) {
      await _setTryOnStudioBefore(false);
      log('Before preview restored TryOn Studio renderer');
      return;
    }
    await _runEffect(() async {
      if (_tab == LabTab.tryLooks) {
        final preset = _currentLook;
        if (preset.isTryOnStudio) {
          await _applyTryOnStudioPreset(preset, showMessage: false);
          log('Before preview restored TryOnStudio preset ${preset.name}');
          return;
        }

        final assetPath = preset.assetPath;
        if (assetPath.isEmpty) return;
        await _deepArController.switchEffect(assetPath);
        _activeSlotPaths['effect'] = assetPath;
        log('Before preview restored preset ${preset.name}');
        return;
      }

      await _restoreBuildSlots();
      log('Before preview restored build look');
    });
  }

  Future<void> _restoreBuildSlots() async {
    final buildSlots = <String, LookItem>{
      'eyeshadow': _eyeshadows[_eyeshadowIndex],
      'eyeliner': _eyeliners[_eyelinerIndex],
      'eyelashes': _lashes[_lashIndex],
      'lips': _lips[_lipIndex],
      'sheerskin':
          _sheerSkin
              ? const LookItem('Sheer Skin', 'effects/filters/sheerskin.deepar')
              : const LookItem('None', ''),
    };

    for (final entry in buildSlots.entries) {
      if (entry.value.assetPath.isEmpty) continue;
      await _deepArController.switchEffectWithSlot(
        slot: entry.key,
        path: entry.value.assetPath,
      );
      _activeSlotPaths[entry.key] = entry.value.assetPath;
    }
  }

  int _wrap(int value, int length) => (value % length + length) % length;

  Future<void> _switchTab(LabTab tab) async {
    if (tab == LabTab.build) {
      await _openCleanBuildTab();
      return;
    }
    if (tab == LabTab.home || tab == LabTab.lab) {
      await _closeTryOnStudioRenderer();
      _activeSlotPaths.remove('tryonstudio');
    }
    setState(() {
      _tab = tab;
      _looksPortalOpen = false;
    });
    if (tab == LabTab.tryLooks) {
      _syncShadeController(_presetIndex);
      unawaited(_applyPreset(_presetIndex));
    }
  }

  Future<void> _openExploreTab() async {
    await _closeTryOnStudioRenderer();
    _activeSlotPaths.remove('tryonstudio');
    if (!mounted) return;
    setState(() {
      _tab = LabTab.home;
      _looksPortalOpen = false;
    });
  }

  Future<void> _openChallengeLab() async {
    await _closeTryOnStudioRenderer();
    _activeSlotPaths.remove('tryonstudio');
    if (!mounted) return;
    setState(() {
      _tab = LabTab.lab;
      _looksPortalOpen = false;
    });
    await _openLookLabPath('/gallery');
  }

  void _toggleLooksPortal() {
    setState(() => _looksPortalOpen = !_looksPortalOpen);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: _isWebTab ? _webWrapperLayer() : _deepArLayer(),
          ),
          if (_beforeAfter)
            Positioned.fill(
              child: IgnorePointer(
                child: Container(color: Colors.black.withValues(alpha: 0.08)),
              ),
            ),
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                color: Colors.white.withValues(
                  alpha: _brightness.clamp(0, 0.32),
                ),
              ),
            ),
          ),
          if (!_isWebTab) SafeArea(child: _topBar()),
          Align(alignment: Alignment.bottomCenter, child: _bottomWorkspace()),
          Positioned(left: 0, right: 0, bottom: 104, child: _looksPortal()),
          Align(alignment: Alignment.bottomCenter, child: _nativeBottomNav()),
        ],
      ),
    );
  }

  bool get _isWebTab => _tab == LabTab.home || _tab == LabTab.lab;

  bool get _isLooksTab => _tab == LabTab.tryLooks || _tab == LabTab.build;

  Widget _sfIcon(
    String symbolName, {
    Key? key,
    required IconData fallback,
    required Color color,
    required double size,
  }) {
    final bytes = _sfSymbolPngs[symbolName];
    if (bytes == null) {
      return Icon(fallback, key: key, color: color, size: size);
    }
    return Image.memory(
      bytes,
      key: key,
      width: size,
      height: size,
      fit: BoxFit.contain,
      color: color,
      colorBlendMode: BlendMode.srcIn,
      gaplessPlayback: true,
    );
  }

  Widget _looksPortal() {
    return IgnorePointer(
      ignoring: !_looksPortalOpen,
      child: SafeArea(
        top: false,
        bottom: false,
        child: AnimatedSlide(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          offset: _looksPortalOpen ? Offset.zero : const Offset(0, 0.16),
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 180),
            opacity: _looksPortalOpen ? 1 : 0,
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 360),
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: const Color(0xff6d6265).withValues(alpha: 0.58),
                        borderRadius: BorderRadius.circular(26),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.30),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.18),
                            blurRadius: 26,
                            offset: const Offset(0, 10),
                          ),
                          BoxShadow(
                            color: _pink.withValues(alpha: 0.12),
                            blurRadius: 30,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _portalButton(
                              symbolName: 'camera.filters',
                              fallbackIcon:
                                  Icons.face_retouching_natural_outlined,
                              label: 'Try Looks',
                              selected: _tab == LabTab.tryLooks,
                              onTap:
                                  () => unawaited(_switchTab(LabTab.tryLooks)),
                            ),
                          ),
                          const SizedBox(width: 7),
                          Expanded(
                            child: _portalButton(
                              symbolName: 'paintpalette',
                              fallbackIcon: Icons.palette_outlined,
                              label: 'Build',
                              selected: _tab == LabTab.build,
                              onTap: () => unawaited(_switchTab(LabTab.build)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _portalButton({
    required String symbolName,
    required IconData fallbackIcon,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        height: 46,
        decoration: BoxDecoration(
          color:
              selected
                  ? Colors.white.withValues(alpha: 0.22)
                  : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color:
                selected
                    ? Colors.white.withValues(alpha: 0.48)
                    : Colors.white.withValues(alpha: 0.18),
          ),
          boxShadow:
              selected
                  ? [
                    BoxShadow(
                      color: _pink.withValues(alpha: 0.20),
                      blurRadius: 20,
                    ),
                  ]
                  : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _sfIcon(
              symbolName,
              fallback: fallbackIcon,
              color: selected ? _pink : Colors.white.withValues(alpha: 0.82),
              size: 18,
            ),
            const SizedBox(width: 7),
            Text(
              label,
              style: TextStyle(
                color:
                    selected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.82),
                fontSize: 12.5,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _nativeBottomNav() {
    final looksActive = _isLooksTab || _looksPortalOpen;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(26, 0, 26, 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(34),
          child: BackdropFilter(
            filter: ui.ImageFilter.blur(sigmaX: 22, sigmaY: 22),
            child: Container(
              height: 66,
              constraints: const BoxConstraints(maxWidth: 390),
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xff6a6264).withValues(alpha: 0.56),
                borderRadius: BorderRadius.circular(34),
                border: Border.all(color: Colors.white.withValues(alpha: 0.30)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.20),
                    blurRadius: 26,
                    offset: const Offset(0, 13),
                  ),
                  BoxShadow(
                    color: _pink.withValues(alpha: 0.10),
                    blurRadius: 34,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _nativeNavItem(
                    label: 'Explore',
                    selected: _tab == LabTab.home && !_looksPortalOpen,
                    icon: _sfIcon(
                      'safari',
                      fallback: Icons.explore_outlined,
                      color:
                          _tab == LabTab.home && !_looksPortalOpen
                              ? _pink
                              : Colors.white.withValues(alpha: 0.68),
                      size: 21,
                    ),
                    onTap: () => unawaited(_openExploreTab()),
                  ),
                  _nativeNavItem(
                    label: 'Looks',
                    selected: looksActive,
                    icon: _sfIcon(
                      looksActive ? 'door.french.open' : 'door.french.closed',
                      key: ValueKey(
                        looksActive ? 'door.french.open' : 'door.french.closed',
                      ),
                      fallback: Icons.door_front_door_outlined,
                      color:
                          looksActive
                              ? _pink
                              : Colors.white.withValues(alpha: 0.68),
                      size: 23,
                    ),
                    onTap: _toggleLooksPortal,
                  ),
                  _nativeNavItem(
                    label: 'Lab',
                    selected: _tab == LabTab.lab && !_looksPortalOpen,
                    icon: _sfIcon(
                      'square.stack.3d.up',
                      fallback: Icons.auto_awesome_motion_outlined,
                      color:
                          _tab == LabTab.lab && !_looksPortalOpen
                              ? _pink
                              : Colors.white.withValues(alpha: 0.68),
                      size: 21,
                    ),
                    onTap: () => unawaited(_openChallengeLab()),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _nativeNavItem({
    required String label,
    required bool selected,
    required Widget icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          height: double.infinity,
          decoration: BoxDecoration(
            color:
                selected
                    ? Colors.white.withValues(alpha: 0.22)
                    : Colors.transparent,
            borderRadius: BorderRadius.circular(27),
            border:
                selected
                    ? Border.all(color: Colors.white.withValues(alpha: 0.46))
                    : null,
            boxShadow:
                selected
                    ? [
                      BoxShadow(
                        color: _pink.withValues(alpha: 0.24),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ]
                    : null,
          ),
          child: IconTheme(
            data: IconThemeData(
              size: 22,
              color: selected ? _pink : Colors.white.withValues(alpha: 0.68),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 260),
                  transitionBuilder:
                      (child, animation) => FadeTransition(
                        opacity: animation,
                        child: ScaleTransition(scale: animation, child: child),
                      ),
                  child: icon,
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    color:
                        selected ? _pink : Colors.white.withValues(alpha: 0.70),
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _webWrapperLayer() {
    final loading = _tab == LabTab.home ? !_homeWebReady : !_lookLabWebReady;

    return ColoredBox(
      color: const Color(0xfff3f2ef),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Stack(
            children: [
              Positioned.fill(
                child:
                    _tab == LabTab.home
                        ? WebViewWidget(controller: _homeWebController)
                        : WebViewWidget(controller: _lookLabWebController),
              ),
              if (loading)
                const Center(child: CircularProgressIndicator(color: _pink)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _deepArLayer() {
    final selectedTryOnStudioPreset =
        _tab == LabTab.tryLooks && _currentLook.isTryOnStudio;
    if (_tryOnStudioRendererActive || selectedTryOnStudioPreset) {
      return _tryOnStudioLayer();
    }

    if (_cameraDenied) {
      return Container(
        color: Colors.black,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.camera_alt_outlined,
              color: Colors.white70,
              size: 42,
            ),
            const SizedBox(height: 14),
            const Text(
              'Camera permission is needed to try on looks.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 14),
            _actionButton(Icons.settings, 'Open Settings', openAppSettings),
          ],
        ),
      );
    }

    if (_arInitialized) {
      return Transform.scale(
        scale: 1.18,
        child: DeepArPreviewPlus(
          _deepArController,
          onViewCreated: () {
            if (_arViewCreated) return;
            _arViewCreated = true;
            Future.delayed(
              const Duration(milliseconds: 550),
              () => _applyPreset(_presetIndex),
            );
          },
        ),
      );
    }
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xffe1ded4), Color(0xff8d9184), Color(0xff23231f)],
        ),
      ),
      alignment: Alignment.center,
      child: const Text(
        'Starting AR camera...',
        style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white70),
      ),
    );
  }

  Widget _tryOnStudioLayer() {
    final filterAsset = _activeTryOnStudioAsset;
    return ColoredBox(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (filterAsset != null &&
              defaultTargetPlatform == TargetPlatform.iOS)
            UiKitView(
              // Keyed on the serial only: one renderer stays alive and new
              // looks are pushed into it, so swiping never restarts the camera.
              key: ValueKey('tryon-studio-$_tryOnStudioViewSerial'),
              viewType: 'tryon_studio_web_view',
              creationParams: <String, Object?>{
                'rendererRoot': _tryOnStudioRendererRoot,
                'payload': _activeTryOnStudioPayload ?? '{}',
                'modelAsset': _tryOnStudioModelAsset,
              },
              creationParamsCodec: const StandardMessageCodec(),
              onPlatformViewCreated: _onTryOnStudioViewCreated,
            )
          else
            const Center(child: CircularProgressIndicator(color: _pink)),
          if (!_tryOnStudioReady || _tryOnStudioStatus != null)
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 28),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 13,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.62),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!_tryOnStudioReady) ...[
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          color: _pink,
                          strokeWidth: 2,
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Flexible(
                      child: Text(
                        _tryOnStudioStatus ??
                            'Starting native TryOn Studio renderer...',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _topBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _roundIcon(
            _favoritePresetNames.isEmpty
                ? Icons.favorite_border
                : Icons.favorite,
            active: true,
            onTap:
                () => _snack(
                  _favoritePresetNames.isEmpty
                      ? 'No saved looks yet'
                      : '${_favoritePresetNames.length} saved looks',
                ),
          ),
          const SizedBox(width: 8),
          _roundIcon(
            Icons.person_outline,
            onTap: () => _snack('Profile web page will open here.'),
          ),
          const Spacer(),
          _beautyPanel(),
        ],
      ),
    );
  }

  Widget _beautyPanel() {
    return Container(
      width: 154,
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 7),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Sheer Skin',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                ),
              ),
              Transform.scale(
                scale: 0.50,
                child: Switch(
                  value: _sheerSkin,
                  activeColor: _pink,
                  inactiveTrackColor: const Color(0xffffedf4),
                  onChanged: (value) {
                    setState(() => _sheerSkin = value);
                    unawaited(
                      _applyBuildSlot(
                        'sheerskin',
                        value
                            ? const LookItem(
                              'Sheer Skin',
                              'effects/filters/sheerskin.deepar',
                            )
                            : const LookItem('None', ''),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
          Row(
            children: [
              const Icon(
                Icons.wb_sunny_outlined,
                size: 14,
                color: Colors.white70,
              ),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 2.5,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 6,
                    ),
                  ),
                  child: Slider(
                    value: _brightness,
                    min: 0,
                    max: 0.32,
                    activeColor: _pink,
                    inactiveColor: Colors.white24,
                    onChanged: (v) => setState(() => _brightness = v),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bottomWorkspace() {
    if (_isWebTab) return const SizedBox.shrink();

    return SafeArea(
      top: false,
      bottom: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 0, 12, _looksPortalOpen ? 182 : 112),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_tab == LabTab.tryLooks) _tryLooksPanel(),
            if (_tab == LabTab.build) _buildPanel(),
          ],
        ),
      ),
    );
  }

  Widget _tryLooksPanel() {
    final looks = _presets;
    final current = _currentLook;

    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _categoryPicker(),
          const SizedBox(height: 12),
          if (looks.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 26),
              child: Text(
                'No shades in this category',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.white54,
                ),
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: Text(
                    current.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  current.tagLine,
                  style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w900,
                    color: _pink,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              '${_presetIndex + 1} of ${looks.length}',
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: Colors.white38,
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 52,
              child: ListView.builder(
                controller: _shadeController,
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.zero,
                itemExtent: _swatchExtent,
                itemCount: looks.length,
                itemBuilder: (context, index) => _swatch(looks[index], index),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _beforeAfterControl()),
              const SizedBox(width: 9),
              _miniCircle(
                _favoritePresetNames.contains(current.name)
                    ? Icons.favorite
                    : Icons.favorite_border,
                onTap: _toggleFavoritePreset,
              ),
              const SizedBox(width: 9),
              _captureButton(size: 58),
            ],
          ),
        ],
      ),
    );
  }

  /// One circular shade. Big enough to tap comfortably, small enough that a
  /// 234-shade palette still scrolls quickly.
  Widget _swatch(LookItem item, int index) {
    final selected = index == _presetIndex;
    final fill = item.lipColor ?? _pink;
    final edge = item.hasLiner ? (item.linerColor ?? _berry) : fill;

    return Center(
      child: GestureDetector(
        onTap: () => _selectShade(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: selected ? 46 : 40,
          height: selected ? 46 : 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [fill, edge],
            ),
            border: Border.all(
              color: selected ? Colors.white : Colors.white24,
              width: selected ? 2.4 : 1,
            ),
            boxShadow: selected
                ? [BoxShadow(color: _pink.withValues(alpha: 0.55), blurRadius: 10)]
                : null,
          ),
        ),
      ),
    );
  }

  Widget _beforeAfterControl() {
    return GestureDetector(
      onLongPressStart: (_) => unawaited(_showBeforeLook()),
      onLongPressEnd: (_) => unawaited(_restoreCurrentLook()),
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            Icon(
              _beforeAfter ? Icons.visibility_off : Icons.compare,
              color: _pink,
              size: 21,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _beforeAfter ? 'Before view' : 'Hold for before',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPanel() {
    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: _sectionHeader('Build', 'Eyes, liner, lashes, lips'),
              ),
              _captureButton(size: 52),
            ],
          ),
          const SizedBox(height: 5),
          _buildPicker(
            'EYES',
            _eyeshadows[_eyeshadowIndex].name,
            '${_eyeshadowIndex + 1}/${_eyeshadows.length}',
            () => _changeBuildIndex('shadow', -1),
            () => _changeBuildIndex('shadow', 1),
          ),
          _buildPicker(
            'LINER',
            _eyeliners[_eyelinerIndex].name,
            '${_eyelinerIndex + 1}/${_eyeliners.length}',
            () => _changeBuildIndex('liner', -1),
            () => _changeBuildIndex('liner', 1),
          ),
          _buildPicker(
            'LASHES',
            _lashes[_lashIndex].name,
            '${_lashIndex + 1}/${_lashes.length}',
            () => _changeBuildIndex('lash', -1),
            () => _changeBuildIndex('lash', 1),
          ),
          _buildPicker(
            'LIPS',
            _lips[_lipIndex].name,
            '${_lipIndex + 1}/${_lips.length}',
            () => _changeBuildIndex('lip', -1),
            () => _changeBuildIndex('lip', 1),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _actionButton(
                  Icons.bookmark_add_outlined,
                  'Save',
                  _saveBuildLook,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _actionButton(
                  Icons.ios_share,
                  'Share',
                  () => _snack('Shareable look image'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          _actionButton(
            Icons.emoji_events_outlined,
            'Submit to Challenge',
            _submitBuildChallenge,
            filled: true,
          ),
        ],
      ),
    );
  }

  Widget _glass({required Widget child}) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 430),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: _panel,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: child,
      ),
    );
  }

  Widget _sectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 1),
        Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 10,
            color: Colors.white60,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildPicker(
    String label,
    String value,
    String count,
    VoidCallback left,
    VoidCallback right,
  ) {
    return Container(
      height: 38,
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.055),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _arrow(Icons.chevron_left, left),
          Expanded(
            child: Row(
              children: [
                SizedBox(
                  width: 58,
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 9,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w900,
                      color: Colors.white60,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                SizedBox(
                  width: 34,
                  child: Text(
                    count,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white54,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          _arrow(Icons.chevron_right, right),
        ],
      ),
    );
  }

  /// Dropdown of every filter category: TOG first, then the brand packages,
  /// then the built-in DeepAR looks.
  Widget _categoryPicker() {
    final category = _currentCategory;
    return PopupMenuButton<int>(
      initialValue: _groupIndex,
      padding: EdgeInsets.zero,
      position: PopupMenuPosition.over,
      color: const Color(0xf217121a),
      constraints: const BoxConstraints(minWidth: 250, maxWidth: 320),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
      ),
      onSelected: _selectCategory,
      itemBuilder: (context) => _categoryMenuEntries(),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.section.toUpperCase(),
                    style: TextStyle(
                      fontSize: 9,
                      letterSpacing: 1.3,
                      fontWeight: FontWeight.w900,
                      color: _pink,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    category.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${category.items.length}',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Colors.white38,
              ),
            ),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 22,
              color: Colors.white70,
            ),
          ],
        ),
      ),
    );
  }

  List<PopupMenuEntry<int>> _categoryMenuEntries() {
    final entries = <PopupMenuEntry<int>>[];
    String? section;
    for (var index = 0; index < _categories.length; index++) {
      final category = _categories[index];
      if (category.section != section) {
        section = category.section;
        if (entries.isNotEmpty) entries.add(const PopupMenuDivider());
        entries.add(
          PopupMenuItem<int>(
            enabled: false,
            height: 28,
            child: Text(
              section.toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                letterSpacing: 1.4,
                fontWeight: FontWeight.w900,
                color: _pink,
              ),
            ),
          ),
        );
      }

      final selected = index == _groupIndex;
      entries.add(
        PopupMenuItem<int>(
          value: index,
          height: 40,
          child: Row(
            children: [
              Expanded(
                child: Text(
                  category.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: selected ? _pink : Colors.white,
                  ),
                ),
              ),
              Text(
                '${category.items.length}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Colors.white38,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return entries;
  }

  Widget _roundIcon(
    IconData icon, {
    bool active = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 42,
        width: 42,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.45),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 14,
            ),
          ],
        ),
        child: Icon(icon, color: active ? _pink : Colors.white, size: 21),
      ),
    );
  }

  Widget _miniCircle(IconData icon, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 42,
        width: 42,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.52),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: _pink, size: 21),
      ),
    );
  }

  Widget _arrow(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 28,
        width: 28,
        decoration: BoxDecoration(
          color: _pink.withValues(alpha: 0.86),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 22),
      ),
    );
  }

  Widget _captureButton({double size = 58}) {
    return GestureDetector(
      onTap: _saveCaptureToPhotos,
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
        ),
        padding: EdgeInsets.all(size * 0.11),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: _pink, width: size * 0.055),
          ),
          child:
              _savingCapture
                  ? SizedBox(
                    width: size * 0.32,
                    height: size * 0.32,
                    child: const CircularProgressIndicator(strokeWidth: 2),
                  )
                  : null,
        ),
      ),
    );
  }

  Widget _actionButton(
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool filled = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 34,
        decoration: BoxDecoration(
          color:
              filled
                  ? _pink.withValues(alpha: 0.92)
                  : Colors.white.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: filled ? Colors.white : _pink),
            const SizedBox(width: 5),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
            ),
          ],
        ),
      ),
    );
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(milliseconds: 900),
      ),
    );
  }
}

enum LookItemKind { deepar, tryOnStudio }

class LookItem {
  final String name;
  final String assetPath;
  final LookItemKind kind;
  final Color? lipColor;
  final Color? linerColor;
  final String finish;
  final bool hasLiner;
  final bool hasGloss;
  final bool hasShimmer;

  /// Set for swatch-pack entries: {region, colour, opacity, finish}.
  final Map<String, dynamic>? shade;

  const LookItem(this.name, this.assetPath)
    : kind = LookItemKind.deepar,
      lipColor = null,
      linerColor = null,
      finish = '',
      hasLiner = false,
      hasGloss = false,
      hasShimmer = false,
      shade = null;

  const LookItem.tryOnStudio(
    this.name,
    this.assetPath, {
    this.lipColor,
    this.linerColor,
    this.finish = 'satin',
    this.hasLiner = false,
    this.hasGloss = false,
    this.hasShimmer = false,
    this.shade,
  }) : kind = LookItemKind.tryOnStudio;

  factory LookItem.fromCatalog(Map<String, dynamic> json) {
    return LookItem.tryOnStudio(
      json['name'] as String? ?? 'Shade',
      json['asset'] as String? ?? '',
      lipColor: parseHexColor(json['lipColor']) ?? const Color(0xffc46e6e),
      linerColor: parseHexColor(json['linerColor']) ?? const Color(0xff6d3540),
      finish: json['finish'] as String? ?? 'satin',
      hasLiner: json['hasLiner'] == true,
      hasGloss: json['hasGloss'] == true,
      hasShimmer: json['hasShimmer'] == true,
      shade: (json['shade'] as Map?)?.cast<String, dynamic>(),
    );
  }

  bool get isShade => shade != null;

  bool get isTryOnStudio => kind == LookItemKind.tryOnStudio;

  /// Short badge under the shade name in the swipe carousel.
  String get tagLine {
    if (!isTryOnStudio) return 'LOOK';
    if (isShade) return finish.toUpperCase();
    final tags = <String>[if (finish.isNotEmpty) finish.toUpperCase()];
    if (hasShimmer) {
      tags.add('SHIMMER');
    } else if (hasGloss) {
      tags.add('GLOSS');
    } else if (hasLiner) {
      tags.add('LINER');
    }
    return tags.join(' · ');
  }
}

class LookCategory {
  final String key;
  final String label;
  final String section;
  final List<LookItem> items;

  const LookCategory({
    required this.key,
    required this.label,
    required this.section,
    required this.items,
  });
}

Color? parseHexColor(Object? value) {
  if (value is! String) return null;
  var hex = value.replaceAll('#', '').trim();
  if (hex.length == 3) {
    hex = hex.split('').map((char) => '$char$char').join();
  }
  if (hex.length != 6) return null;
  final parsed = int.tryParse(hex, radix: 16);
  if (parsed == null) return null;
  return Color(0xff000000 | parsed);
}
