import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:developer';

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
      theme: ThemeData.light(useMaterial3: true).copyWith(
        textTheme: ThemeData.light().textTheme.apply(
          bodyColor: const Color(0xff1c1917),
          displayColor: const Color(0xff1c1917),
        ),
        scaffoldBackgroundColor: const Color(0xfff7f2ef),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xffe91e63),
          brightness: Brightness.light,
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
  // Matches the web app so the two halves read as one product:
  // #E91E63 accent, #F7F2EF ground, #EDE7E3 borders, stone text.
  static const _pink = Color(0xffe91e63);
  static const _berry = Color(0xffb8887a);
  static const _panel = Color(0xfaf7f2ef);
  static const _ink = Color(0xff1c1917);
  static const _muted = Color(0xff57534e);
  static const _line = Color(0xffede7e3);
  static const _sfSymbolsChannel = MethodChannel('gleame/sf_symbols');
  static const _googleSignInChannel = MethodChannel('gleame/google_signin');

  // Saved looks are written straight to Firestore over REST. Routing them
  // through the web bridge depended on which WebView held the session, which
  // is what kept the saves from landing.
  static const _firebaseApiKey = 'AIzaSyBdKGptmjaFKURh0vMkyNyA-y-WhP9ozKo';
  static const _firestoreProject = 'kobella-39c79';
  static const _firestoreDatabase =
      'ai-studio-tryonbeautylookl-ab92ce94-89bf-43fe-8f79-10fcc718998b';
  String? _firebaseIdToken;
  String? _firebaseUid;
  String? _firebaseRefreshToken;
  DateTime? _tokenExpiry;
  // Cloud Run service we control, so the web side can be redeployed alongside
  // the app. The AI Studio URL still serves the same app if it is preferred.
  static const _liveWebBaseUrl =
      'https://gleame-web-729820542986.asia-southeast1.run.app';
  // ignore: unused_field
  static const _aiStudioWebBaseUrl = 'https://tryon-beauty.ai.studio';
  // Always the live site, in every build mode. Running from Xcode builds Debug,
  // and pointing that at a local dev server meant the web side failed with
  // NSURLErrorCannotConnectToHost (-1004) unless one happened to be running.
  // Pass --dart-define=GLEAME_WEB_BASE_URL=http://127.0.0.1:3000 for local work.
  static const _webBaseUrl = String.fromEnvironment(
    'GLEAME_WEB_BASE_URL',
    defaultValue: _liveWebBaseUrl,
  );
  static Uri _embeddedWebUri(String path) =>
      Uri.parse('$_webBaseUrl$path?embedded=ios');
  static final Uri _webHomeUri = _embeddedWebUri('/home');
  static final Uri _webLookLabUri = _embeddedWebUri('/gallery');
  static const _tryOnStudioModelAsset =
      'assets/tryonstudio_native/face_landmarker.task';
  static const _tryOnStudioCatalogAsset = 'assets/tryonstudio_catalog.json';
  static const _tryOnStudioRendererRoot = 'assets/tryonstudio_renderer';

  final WebViewController _homeWebController = WebViewController();
  final WebViewController _lookLabWebController = WebViewController();
  final Set<String> _favoritePresetNames = {};
  final Map<String, Uint8List> _sfSymbolPngs = {};
  MethodChannel? _tryOnStudioNativeChannel;
  String? _activeTryOnStudioAsset;

  LabTab _tab = LabTab.home;
  final bool _arInitialized = false;
  bool _arViewCreated = false;
  bool _savingCapture = false;
  bool _cameraDenied = false;
  bool _homeWebReady = false;
  bool _lookLabWebReady = false;
  bool _looksPortalOpen = false;
  bool _beforeAfter = false;
  bool _tryOnStudioRendererActive = false;
  bool _tryOnStudioReady = false;
  double _brightness = 0.10;
  String? _tryOnStudioStatus;
  final Map<String, Timer> _slotDebounceTimers = {};
  final Map<String, String> _activeSlotPaths = {};
  final ScrollController _shadeController = ScrollController();
  static const double _swatchExtent = 42;
  Timer? _shadeApplyTimer;
  int _tryOnStudioViewSerial = 0;
  int _groupIndex = 0;
  int _presetIndex = 0;

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
    final looks = _visibleLooks;
    if (looks.isEmpty) return const LookItem('None', '');
    return looks[_presetIndex.clamp(0, looks.length - 1)];
  }

  @override
  void initState() {
    super.initState();
    _configureWebControllers();
    unawaited(_loadSfSymbols());
    unawaited(_loadSavedState());
    unawaited(_loadFilterCatalog());
    unawaited(_loadSavedLooks());
    unawaited(_restoreFirebaseSession());
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
  }

  bool _lookLabWebStarted = false;

  void _ensureLookLabWeb() {
    if (_lookLabWebStarted) return;
    _lookLabWebStarted = true;
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
      // Google refuses OAuth from a user agent it recognises as an embedded
      // WebView, which is why "Continue with Google" appeared to do nothing.
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 '
        'Mobile/15E148 Safari/604.1',
      )
      ..addJavaScriptChannel(
        'GleameBridge',
        onMessageReceived: (message) {
          log('Gleame web bridge: ${message.message}');
          try {
            final decoded = jsonDecode(message.message) as Map<String, dynamic>;
            final type = decoded['type'] as String?;
            final target = decoded['target'] as String?;
            if (type == 'gleame:presets') {
              final list = (decoded['presets'] as List? ?? const [])
                  .whereType<Map>()
                  .map((e) => WebPreset.fromJson(e.cast<String, dynamic>()))
                  .toList();
              if (list.isNotEmpty && mounted) {
                setState(() => _webPresets = list);
                log('Loaded ${list.length} presets from the web app');
              }
              return;
            }
            // The web page asks the app to run Google sign-in natively,
            // because Google refuses OAuth inside a WebView.
            if (type == 'gleame:native-google-signin') {
              unawaited(_runNativeGoogleSignIn());
              return;
            }
            if (type == 'gleame:open-filter') {
              final id = decoded['filterId'] as String?;
              if (id != null) {
                unawaited(_openFilterById(id));
                return;
              }
            }
            if (type == 'gleame:navigate-native') {
              unawaited(_handleWebNavigation(target));
              return;
            }
            final status = decoded['message'] as String?;
            if (status != null) log('Web bridge status: $status');
          } catch (_) {
            if (mounted) _snack(message.message);
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            onLoaded();
            // Presets are maintained in the web app; ask it for the current
            // list rather than keeping a second copy here.
            unawaited(
              controller.runJavaScript(
                'window.__gleameSendPresets && window.__gleameSendPresets();',
              ),
            );
          },
          // The web app is a SPA, so its route changes arrive here rather than
          // as page loads. Try On and Create belong to the native filter pages,
          // so catch those routes and switch tabs. This works against the live
          // site as it is today - it does not wait on a web redeploy.
          onUrlChange: (change) {
            final path = Uri.tryParse(change.url ?? '')?.path ?? '';
            // These are the paths the web app's own getPathFromTab pushes.
            // Create pushes /editor, and the Try On catalog pushes /presets.
            const tryOnPaths = ['/looks', '/built-looks', '/presets'];
            const createPaths = ['/editor', '/sandbox'];
            final isTryOn = tryOnPaths.contains(path);
            final isCreate = createPaths.contains(path);
            if (!isTryOn && !isCreate) return;
            unawaited(_handleWebNavigation(isTryOn ? 'try' : 'build'));
            // Pop the placeholder route so returning from the native page
            // lands back on Home or Community, never on these web pages.
            unawaited(controller.goBack());
          },
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

  // Mix & Match: one selection per makeup region, plus the preview source.
  final Map<String, LookItem> _mixSlots = {};
  String? _mixModelUrl;
  int _mixCategory = 0;
  bool _singleLookMode = false;
  bool _shadesOpen = false;
  String? _restoreGroupKey;
  String? _restoreShadeId;
  String _shadeQuery = '';
  List<Map<String, dynamic>> _savedLooks = const [];
  bool _favouritesOnly = false;
  String? _family;
  bool _searchOpen = false;
  final TextEditingController _searchController = TextEditingController();
  List<WebPreset> _webPresets = const [];

  Future<void> _openTryOnStudioRenderer(LookItem item) async {
    final cameraStatus = await Permission.camera.request();
    if (!cameraStatus.isGranted) {
      if (mounted) setState(() => _cameraDenied = true);
      throw StateError('Camera permission denied');
    }

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
    _ensureLookLabWeb();
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
      var group = 0;
      var shade = 0;
      if (_restoreGroupKey != null) {
        final g = categories.indexWhere((c) => c.key == _restoreGroupKey);
        if (g >= 0) {
          group = g;
          final i = categories[g].items.indexWhere(
            (item) => item.id == _restoreShadeId,
          );
          if (i >= 0) shade = i;
        }
      }
      setState(() {
        _categories = categories;
        _groupIndex = group;
        _presetIndex = shade;
      });
      log('Loaded ${categories.length} filter categories');
    } catch (e, st) {
      log('Filter catalog failed to load: $e', stackTrace: st);
    }
  }

  /// Keeps the last category and shade so the app reopens where it was left.
  Future<void> _rememberSelection(LookItem item) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('last_group', _currentCategory.key);
      await prefs.setString('last_shade', item.id);
    } catch (_) {
      // Preferences are a convenience; never block a shade change on them.
    }
  }

  Future<void> _loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = prefs.getStringList('favorite_presets') ?? const [];
    final lastGroup = prefs.getString('last_group');
    final lastShade = prefs.getString('last_shade');
    if (!mounted) return;
    setState(() {
      _favoritePresetNames.addAll(favorites);
      _restoreGroupKey = lastGroup;
      _restoreShadeId = lastShade;
    });
  }

  @override
  void dispose() {
    for (final timer in _slotDebounceTimers.values) {
      timer.cancel();
    }
    _shadeApplyTimer?.cancel();
    _shadeController.dispose();
    _searchController.dispose();
    unawaited(_tryOnStudioNativeChannel?.invokeMethod<void>('stop'));
    super.dispose();
  }

  Future<void> _applyPreset(int index) async {
    final looks = _visibleLooks;
    if (looks.isEmpty) return;
    final safeIndex = index.clamp(0, looks.length - 1);
    setState(() => _presetIndex = safeIndex);
    final item = looks[safeIndex];
    unawaited(_rememberSelection(item));
    await _applyTryOnStudioPreset(item);
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

  /// Mix & Match composes one Studio payload from every selected region.
  /// Each pack owns its own texture and controls, so the merge takes each
  /// region's half from the filter that defines it.
  Future<void> _applyMixAndMatch() async {
    if (_mixSlots.isEmpty) {
      await _closeTryOnStudioRenderer();
      return;
    }

    try {
      Map<String, dynamic>? merged;
      LookItem? first;

      for (final entry in _mixSlots.entries) {
        final region = entry.key;
        final item = entry.value;
        first ??= item;
        final raw = jsonDecode(await rootBundle.loadString(item.assetPath))
            as Map<String, dynamic>;
        final part =
            jsonDecode(_previewPayload(raw, item)) as Map<String, dynamic>;
        if (merged == null) {
          merged = part;
          continue;
        }

        final look = Map<String, dynamic>.from(merged['look'] as Map? ?? {});
        final partLook = part['look'] as Map? ?? {};
        for (final key in ['palette', 'intensity', 'textures']) {
          final target = Map<String, dynamic>.from(look[key] as Map? ?? {});
          final source = partLook[key] as Map? ?? {};
          if (source[region] != null) target[region] = source[region];
          look[key] = target;
        }
        merged['look'] = look;

        final layers = Map<String, dynamic>.from(merged['layers'] as Map? ?? {});
        layers[region] = true;
        merged['layers'] = layers;

        final assets = (merged['assets'] as List? ?? const [])
            .whereType<Map>()
            .map((a) => Map<String, dynamic>.from(a))
            .where((a) => a['region'] != region)
            .toList();
        for (final asset in (part['assets'] as List? ?? const [])) {
          if (asset is Map && asset['region'] == region) {
            assets.add(Map<String, dynamic>.from(asset));
          }
        }
        merged['assets'] = assets;

        for (final key in ['cheekControls', 'eyeControls', 'lipControls']) {
          if (part[key] != null && _controlsRegion(key) == region) {
            merged[key] = part[key];
          }
        }
      }

      if (merged == null || first == null) return;
      await _pushStudioPayload(jsonEncode(merged), first);
    } catch (e, st) {
      log('Mix & Match compose failed: $e', stackTrace: st);
      if (mounted) _snack('Could not combine those shades.');
    }
  }

  String _controlsRegion(String key) => switch (key) {
    'cheekControls' => 'cheeks',
    'eyeControls' => 'eyes',
    _ => 'lips',
  };

  Future<void> _pushStudioPayload(String payload, LookItem anchor) async {
    _activeTryOnStudioPayload = payload;
    final live = _tryOnStudioNativeChannel;
    if (_tryOnStudioRendererActive && live != null) {
      await live.invokeMethod<void>('setPayload', payload);
      return;
    }
    await _openTryOnStudioRenderer(anchor);
  }

  /// A saved look from the web app, rendered here with TryOn Studio filters so
  /// presets live in one place: the web app's built_looks.
  Future<void> _applyWebPreset(WebPreset preset) async {
    final lip = _nearestShade('lip_swatches', preset.lipColor);
    final blush = _nearestShade('blush_swatches', preset.blushColor);
    setState(() {
      _mixSlots.clear();
      if (lip != null) _mixSlots['lips'] = lip;
      if (blush != null) _mixSlots['cheeks'] = blush;
    });
    await _applyMixAndMatch();
  }

  /// Maps a web preset colour onto the closest shade we actually ship.
  LookItem? _nearestShade(String group, String? hex) {
    final target = parseHexColor(hex);
    final items = _shadesFor(group);
    if (target == null || items.isEmpty) return null;
    LookItem? best;
    var bestScore = double.infinity;
    for (final item in items) {
      final c = item.lipColor;
      if (c == null) continue;
      final score = ((c.r - target.r) * (c.r - target.r) +
              (c.g - target.g) * (c.g - target.g) +
              (c.b - target.b) * (c.b - target.b))
          .toDouble();
      if (score < bestScore) {
        bestScore = score;
        best = item;
      }
    }
    return best;
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
      log('Loaded TryOnStudio preset ${item.name}: ${item.assetPath}');
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
      _family = null;
      _shadeQuery = '';
      _searchOpen = false;
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

  /// Hearting a shade saves it to the account, not just this phone. It used
  /// to write only to SharedPreferences, which is why nothing reached
  /// Firestore or the web profile.
  Future<void> _toggleFavoritePreset() async {
    final look = _currentLook;
    final name = look.name;
    final nowSaved = !_favoritePresetNames.contains(name);

    setState(() {
      if (nowSaved) {
        _favoritePresetNames.add(name);
      } else {
        _favoritePresetNames.remove(name);
      }
    });

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      'favorite_presets',
      _favoritePresetNames.toList()..sort(),
    );

    if (!nowSaved) {
      _confirmToast(true, 'Removed');
      return;
    }

    _pendingLookId =
        'ios_${DateTime.now().millisecondsSinceEpoch}_'
                '${name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_')}'
            .replaceAll(RegExp(r'_+$'), '');
    final ok = await _writeLookToFirestore(
      collection: 'saved_looks',
      docId: _pendingLookId,
      look: {
        'name': name,
        'description': 'Saved while trying on in the Gleame app.',
        'visibility': 'private',
        'savedFrom': 'tryon',
        'savedAt': DateTime.now().millisecondsSinceEpoch,
        'shades': [
          {
            'region': look.shade?['region'] ?? 'lips',
            'id': look.id,
            'name': look.name,
            'swatch': _hex(look.lipColor),
          },
        ],
        'lipColor': _hex(look.lipColor),
      },
    );
    _confirmToast(ok, ok ? 'Saved' : 'Couldn\'t save');
  }

  /// Saved looks are stored as the shade ids behind them, so reopening one
  /// restores the exact filters rather than an approximation of its colours.
  Future<void> _loadSavedLooks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getStringList('saved_mix_looks') ?? const [];
      final looks = raw
          .map((e) => jsonDecode(e) as Map<String, dynamic>)
          .toList();
      if (!mounted || looks.isEmpty) return;
      setState(() => _savedLooks = looks);
    } catch (e, st) {
      log('Saved looks failed to load: $e', stackTrace: st);
    }
  }

  Future<void> _applySavedLook(Map<String, dynamic> look) async {
    final slots = (look['slots'] as Map?)?.cast<String, dynamic>() ?? {};
    setState(() {
      _mixSlots.clear();
      slots.forEach((region, id) {
        for (final category in _categories) {
          final match = category.items.where((i) => i.id == id);
          if (match.isNotEmpty) {
            _mixSlots[region] = match.first;
            return;
          }
        }
      });
    });
    await _applyMixAndMatch();
  }

  /// Name it, describe it, and choose whether it goes to the community or
  /// stays private. Both land in the user's account; only shared looks are
  /// visible to anyone else.
  Future<void> _saveBuildLook() async {
    if (_mixSlots.isEmpty) {
      _snack('Pick a shade first');
      return;
    }
    final nameController = TextEditingController(text: _buildLookName());
    final descController = TextEditingController();
    var share = false;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheet) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 20),
            decoration: const BoxDecoration(
              color: Color(0xfff7f2ef),
              borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Save this look',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 12),
                _sheetField(nameController, 'Look name', 1),
                const SizedBox(height: 9),
                _sheetField(descController, 'Description (optional)', 2),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _shareOption(
                        'Private',
                        'Only in your account',
                        Icons.lock_outline,
                        !share,
                        () => setSheet(() => share = false),
                      ),
                    ),
                    const SizedBox(width: 9),
                    Expanded(
                      child: _shareOption(
                        'Share',
                        'Post to the community',
                        Icons.public,
                        share,
                        () => setSheet(() => share = true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                GestureDetector(
                  onTap: () => Navigator.of(sheetContext).pop(true),
                  child: Container(
                    height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _pink,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'Save look',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed != true) return;
    await _persistLook(
      name: nameController.text.trim().isEmpty
          ? _buildLookName()
          : nameController.text.trim(),
      description: descController.text.trim(),
      share: share,
    );
  }

  Widget _sheetField(TextEditingController c, String hint, int lines) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: _line),
      ),
      child: TextField(
        controller: c,
        maxLines: lines,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        cursorColor: _pink,
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 13, color: _muted),
        ),
      ),
    );
  }

  Widget _shareOption(
    String title,
    String subtitle,
    IconData icon,
    bool on,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
        decoration: BoxDecoration(
          color: on ? _pink.withValues(alpha: 0.10) : Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: on ? _pink : _line, width: on ? 1.6 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: on ? _pink : _muted),
            const SizedBox(height: 5),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 9, color: _muted),
            ),
          ],
        ),
      ),
    );
  }

  String _pendingLookId = '';

  Future<void> _persistLook({
    required String name,
    required String description,
    required bool share,
  }) async {
    if (_mixSlots.isEmpty) {
      _snack('Pick a shade first');
      return;
    }
    _pendingLookId =
        'ios_${DateTime.now().millisecondsSinceEpoch}_'
        '${name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_')}'
            .replaceAll(RegExp(r'_+$'), '');
    final entry = {
      'name': name,
      'description': description,
      'shared': share,
      'slots': {
        for (final e in _mixSlots.entries) e.key: e.value.id,
      },
      'lip': _mixSlots['lips']?.lipColor?.toARGB32().toRadixString(16),
      'blush': _mixSlots['cheeks']?.lipColor?.toARGB32().toRadixString(16),
    };
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('saved_mix_looks') ?? <String>[];
    saved.insert(0, jsonEncode(entry));
    while (saved.length > 20) {
      saved.removeLast();
    }
    await prefs.setStringList('saved_mix_looks', saved);
    if (mounted) {
      setState(
        () => _savedLooks = saved
            .map((e) => jsonDecode(e) as Map<String, dynamic>)
            .toList(),
      );
    }
    // Written straight to Firestore by the app. The web bridge is still
    // notified so the community copy and challenge entry can be made, but the
    // account save no longer depends on it.
    final ok = await _writeLookToFirestore(
      collection: 'saved_looks',
      docId: _pendingLookId,
      look: {
        'name': name,
        'description': description,
        'visibility': share ? 'public' : 'private',
        'savedFrom': _tab == LabTab.build ? 'mixnmatch' : 'tryon',
        'savedAt': DateTime.now().millisecondsSinceEpoch,
        'shades': [
          for (final e in _mixSlots.entries)
            {
              'region': e.key,
              'id': e.value.id,
              'name': e.value.name,
              'swatch': _hex(e.value.lipColor),
            },
        ],
        'lipColor': _hex(_mixSlots['lips']?.lipColor),
        'blushColor': _hex(_mixSlots['cheeks']?.lipColor),
      },
    );
    if (!ok) return;
    unawaited(
      _sendBuildLookToWeb(
        'gleame:save-built-look',
        name: name,
        description: description,
        shared: share,
      ),
    );
    if (share) {
      unawaited(
        _sendBuildLookToWeb(
          'gleame:submit-challenge',
          name: name,
          description: description,
          shared: true,
        ),
      );
    }
    _confirmToast(true, share ? 'Shared' : 'Saved');
  }

  String _buildLookName() {
    final parts = _mixSlots.values.map((i) => i.name).toList();
    return parts.isEmpty ? 'Clean Gleame Look' : parts.take(2).join(' + ');
  }

  /// Kept deliberately small: shade names, swatch hexes and the filter ids.
  /// No textures or filter JSON travel to Firestore - the app already has
  /// those, and the ids are enough to reproduce the look exactly.
  Map<String, Object?> _buildLookPayload({
    String? name,
    String? description,
    bool shared = false,
    LookItem? shade,
  }) {
    final shades = <Map<String, String?>>[];
    if (shade != null) {
      shades.add({
        'region': shade.shade?['region'] as String? ?? 'lips',
        'id': shade.id,
        'name': shade.name,
        'swatch': _hex(shade.lipColor),
      });
    } else {
      for (final entry in _mixSlots.entries) {
        final item = entry.value;
        shades.add({
          'region': entry.key,
          'id': item.id,
          'name': item.name,
          'swatch': _hex(item.lipColor),
        });
      }
    }

    return {
      'lookName': name ?? _buildLookName(),
      'description': (description == null || description.isEmpty)
          ? 'Built in the Gleame iOS try-on app.'
          : description,
      'visibility': shared ? 'public' : 'private',
      // Tells the web which saved_* collection this belongs in.
      'savedFrom': shade != null || _tab != LabTab.build ? 'tryon' : 'mixnmatch',
      // Stable id so delivering to both web views writes one document.
      'lookId': _pendingLookId,
      'category': 'built',
      'source': 'gleame-ios-wrapper',
      'shades': shades,
      'makeupConfig': {
        'lipColor': _hex(shade?.lipColor ?? _mixSlots['lips']?.lipColor),
        'blushColor': _hex(_mixSlots['cheeks']?.lipColor),
        'eyeshadowColor': _hex(_mixSlots['eyes']?.lipColor),
        'preset': _tab == LabTab.tryLooks ? _currentLook.name : null,
      },
    };
  }

  static String? _hex(Color? c) =>
      c == null ? null : '#${(c.toARGB32() & 0xffffff).toRadixString(16).padLeft(6, '0')}';

  Future<void> _sendBuildLookToWeb(
    String type, {
    String? name,
    String? description,
    bool shared = false,
    LookItem? shade,
  }) async {
    final message = <String, Object?>{
      'source': 'gleame-ios-wrapper',
      'type': type,
      'payload': _buildLookPayload(
        name: name,
        description: description,
        shared: shared,
        shade: shade,
      ),
    };
    final script =
        "window.dispatchEvent(new MessageEvent('message', { data: ${jsonEncode(message)} }));";

    // Deliver to whichever view actually holds the session. The views do not
    // reliably share Firebase's IndexedDB, so the signed-in one is the only
    // one that can write.
    final target = await _signedInWebController();
    if (target == null) {
      if (mounted) {
        _snack('Open Home and sign in, then save again.');
      }
      return;
    }
    try {
      await target.runJavaScript(script);
      log('Save delivered to signed-in web view');
      return;
    } catch (e, st) {
      log('Targeted bridge send failed: \$e', stackTrace: st);
    }
    try {
      await _homeWebController.runJavaScript(script);
      if (_lookLabWebStarted) {
        try {
          await _lookLabWebController.runJavaScript(script);
        } catch (_) {
          // One view failing must not lose the save.
        }
      }
    } catch (e, st) {
      log('Web bridge send failed: \$e', stackTrace: st);
      if (mounted) _snack('Sign in on the web tab to sync this look.');
    }
  }

  /// Returns the web view with a signed-in Firebase session, if any.
  Future<WebViewController?> _signedInWebController() async {
    final candidates = <WebViewController>[
      _homeWebController,
      if (_lookLabWebStarted) _lookLabWebController,
    ];
    for (final controller in candidates) {
      try {
        final result = await controller.runJavaScriptReturningResult(
          "(window.__gleameUid || '')",
        );
        final uid = result.toString().replaceAll('"', '').trim();
        if (uid.isNotEmpty) {
          log('Signed-in web view found: \$uid');
          return controller;
        }
      } catch (e) {
        log('Could not read uid from a web view: \$e');
      }
    }
    return null;
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

      await _saveTryOnStudioCaptureToPhotos();
    } catch (e, st) {
      log('Capture failed: $e', stackTrace: st);
      _snack('Capture failed.');
    } finally {
      if (mounted) setState(() => _savingCapture = false);
    }
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
    });
    // Bring the camera up straight away with nothing applied yet, rather than
    // waiting for the first shade to be picked.
    await _applyMixAndMatch();
  }

  // ignore: unused_element
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
    log('Before preview: no renderer running');
  }

  Future<void> _restoreCurrentLook() async {
    if (!_beforeAfter) return;
    setState(() => _beforeAfter = false);
    if (_tryOnStudioRendererActive) {
      await _setTryOnStudioBefore(false);
      log('Before preview restored TryOn Studio renderer');
      return;
    }
    log('Before preview: no renderer running');
  }

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
      _singleLookMode = false;
      _syncShadeController(_presetIndex);
      unawaited(_applyPreset(_presetIndex));
    }
  }

  /// Opens one look straight from a web card, by catalog id. Single-look mode
  /// shows just that filter; its palette stays behind the Shades menu.
  Future<void> _openFilterById(String id) async {
    LookItem? found;
    var groupIndex = 0;
    var itemIndex = 0;
    for (var g = 0; g < _categories.length; g++) {
      final items = _categories[g].items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
          found = items[i];
          groupIndex = g;
          itemIndex = i;
          break;
        }
      }
      if (found != null) break;
    }
    if (found == null) {
      log('No catalog filter with id \$id');
      if (mounted) _snack('That look is not in the catalog yet.');
      return;
    }
    setState(() {
      _tab = LabTab.tryLooks;
      _groupIndex = groupIndex;
      _presetIndex = itemIndex;
      _singleLookMode = true;
      _family = null;
      _favouritesOnly = false;
      _shadeQuery = '';
      _searchOpen = false;
    });
    _syncShadeController(itemIndex);
    await _applyPreset(itemIndex);
  }

  /// Runs Google sign-in in Safari via ASWebAuthenticationSession and hands
  /// the resulting ID token to the web page, which completes the Firebase
  /// session with signInWithCredential.
  Future<void> _runNativeGoogleSignIn() async {
    try {
      final idToken = await _googleSignInChannel.invokeMethod<String>('signIn');
      if (idToken == null || idToken.isEmpty) {
        if (mounted) _snack('Google sign-in was cancelled.');
        return;
      }
        await _exchangeGoogleToken(idToken);
      final script =
          'window.__gleameGoogleCredential && '
          'window.__gleameGoogleCredential(${jsonEncode(idToken)});';
      await _homeWebController.runJavaScript(script);
      if (_lookLabWebStarted) {
        try {
          await _lookLabWebController.runJavaScript(script);
        } catch (_) {
          // The other view may not be loaded; the home one is what matters.
        }
      }
    } on PlatformException catch (e) {
      log('Native Google sign-in failed: \${e.message}');
      if (mounted) _snack(e.message ?? 'Google sign-in failed.');
    } catch (e, st) {
      log('Native Google sign-in error: \$e', stackTrace: st);
      if (mounted) _snack('Google sign-in failed.');
    }
  }

  Future<Map<String, dynamic>?> _postJson(
    Uri url,
    Map<String, dynamic> body, {
    String? bearer,
    String method = 'POST',
  }) async {
    final client = HttpClient();
    try {
      final request = await client.openUrl(method, url);
      request.headers.contentType = ContentType.json;
      if (bearer != null) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $bearer');
      }
      request.add(utf8.encode(jsonEncode(body)));
      final response = await request.close();
      final text = await response.transform(utf8.decoder).join();
      final decoded = text.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(text) as Map<String, dynamic>;
      if (response.statusCode >= 400) {
        final message =
            (decoded['error'] as Map?)?['message']?.toString() ?? text;
        throw StateError('${response.statusCode}: $message');
      }
      return decoded;
    } finally {
      client.close();
    }
  }

  /// Trades Google's ID token for a Firebase session the app can use directly.
  Future<void> _exchangeGoogleToken(String googleIdToken) async {
    try {
      final data = await _postJson(
        Uri.parse(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp'
          '?key=$_firebaseApiKey',
        ),
        {
          'postBody': 'id_token=$googleIdToken&providerId=google.com',
          'requestUri': 'https://$_firestoreProject.firebaseapp.com',
          'returnSecureToken': true,
        },
      );
      if (data == null) return;
      _firebaseIdToken = data['idToken'] as String?;
      _firebaseUid = data['localId'] as String?;
      _firebaseRefreshToken = data['refreshToken'] as String?;
      _tokenExpiry = DateTime.now().add(const Duration(minutes: 55));
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fb_refresh', _firebaseRefreshToken ?? '');
      await prefs.setString('fb_uid', _firebaseUid ?? '');
      log('Firebase session ready for $_firebaseUid');
    } catch (e, st) {
      log('Token exchange failed: $e', stackTrace: st);
      if (mounted) _snack('Sign-in could not be completed: $e');
    }
  }

  /// Restores the Firebase session from the stored refresh token.
  Future<void> _restoreFirebaseSession() async {
    final prefs = await SharedPreferences.getInstance();
    final refresh = prefs.getString('fb_refresh');
    final uid = prefs.getString('fb_uid');
    if (refresh == null || refresh.isEmpty || uid == null || uid.isEmpty) return;
    _firebaseRefreshToken = refresh;
    _firebaseUid = uid;
    _tokenExpiry = DateTime.fromMillisecondsSinceEpoch(0);
    _firebaseIdToken = '';
    await _validToken();
  }

  Future<String?> _validToken() async {
    if (_tokenExpiry != null &&
        DateTime.now().isBefore(_tokenExpiry!) &&
        (_firebaseIdToken ?? '').isNotEmpty) {
      return _firebaseIdToken;
    }
    final refresh = _firebaseRefreshToken;
    if (refresh == null || refresh.isEmpty) {
      return (_firebaseIdToken ?? '').isEmpty ? null : _firebaseIdToken;
    }
    try {
      final data = await _postJson(
        Uri.parse(
          'https://securetoken.googleapis.com/v1/token?key=$_firebaseApiKey',
        ),
        {'grant_type': 'refresh_token', 'refresh_token': refresh},
      );
      _firebaseIdToken = data?['id_token'] as String? ?? _firebaseIdToken;
      _firebaseRefreshToken = data?['refresh_token'] as String? ?? refresh;
      _firebaseUid = data?['user_id'] as String? ?? _firebaseUid;
      _tokenExpiry = DateTime.now().add(const Duration(minutes: 55));
    } catch (e) {
      log('Token refresh failed: $e');
    }
    return (_firebaseIdToken ?? '').isEmpty ? null : _firebaseIdToken;
  }

  /// The uid inside the token is the only one Firestore will accept. Reading
  /// it from the token rather than from stored state removes any chance of the
  /// two drifting apart, which reads as a permissions failure.
  String? _uidFromToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return null;
      var payload = parts[1].replaceAll('-', '+').replaceAll('_', '/');
      while (payload.length % 4 != 0) {
        payload += '=';
      }
      final claims =
          jsonDecode(utf8.decode(base64.decode(payload))) as Map<String, dynamic>;
      return (claims['user_id'] ?? claims['sub'])?.toString();
    } catch (e) {
      log('Could not read uid from token: $e');
      return null;
    }
  }

  Map<String, dynamic> _firestoreValue(Object? value) {
    if (value == null) return {'nullValue': null};
    if (value is bool) return {'booleanValue': value};
    if (value is int) return {'integerValue': '$value'};
    if (value is double) return {'doubleValue': value};
    if (value is List) {
      return {
        'arrayValue': {'values': value.map(_firestoreValue).toList()},
      };
    }
    if (value is Map) {
      return {
        'mapValue': {
          'fields': {
            for (final e in value.entries) '${e.key}': _firestoreValue(e.value),
          },
        },
      };
    }
    return {'stringValue': value.toString()};
  }

  /// Writes a saved look to Firestore as the signed-in user.
  Future<bool> _writeLookToFirestore({
    required String collection,
    required String docId,
    required Map<String, Object?> look,
  }) async {
    final token = await _validToken();
    if (token == null) {
      if (mounted) _snack('Sign in with Google first, then save.');
      return false;
    }
    final uid = _uidFromToken(token) ?? _firebaseUid;
    if (uid == null || uid.isEmpty) {
      if (mounted) _snack('Sign in with Google first, then save.');
      return false;
    }
    _firebaseUid = uid;
    final url = Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$_firestoreProject'
      '/databases/$_firestoreDatabase/documents/users/$uid/$collection/$docId',
    );
    try {
      await _postJson(
        url,
        {
          'fields': {
            for (final e in look.entries) e.key: _firestoreValue(e.value),
          },
        },
        bearer: token,
        method: 'PATCH',
      );
      log('Saved to users/$uid/$collection/$docId');
      return true;
    } catch (e, st) {
      log('Firestore write failed for users/$uid/$collection/$docId: $e',
          stackTrace: st);
      if (mounted) _confirmToast(false, 'Couldn\'t save');
      return false;
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
          if (!_isWebTab)
            SafeArea(
              child: Align(
                alignment: Alignment.topLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 14, top: 4),
                  child: GestureDetector(
                    onTap: () => unawaited(_openExploreTab()),
                    child: Container(
                      width: 36,
                      height: 36,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.92),
                        border: Border.all(color: _line),
                      ),
                      child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 15,
                        color: _ink,
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool get _isWebTab => _tab == LabTab.home || _tab == LabTab.lab;

  /// The web app renders the real navigation dock. Try On and Create open
  /// these native filter pages from it, so all they need is a way back.
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
              color: _muted,
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
        style: TextStyle(fontWeight: FontWeight.w900, color: _muted),
      ),
    );
  }

  /// Shown while the renderer and its face model warm up, so a cold start
  /// reads as loading rather than a black screen.
  Widget _startupOverlay(String message) {
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [_pink, _berry]),
              ),
              child: const Icon(
                Icons.auto_awesome,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Gleame',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 120,
              child: LinearProgressIndicator(
                minHeight: 2.5,
                backgroundColor: _line,
                color: _pink,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              message,
              style: const TextStyle(fontSize: 11, color: _muted),
            ),
          ],
        ),
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
            _startupOverlay('Warming up the camera'),
          if (!_tryOnStudioReady && _tryOnStudioStatus == null)
            _startupOverlay('Loading filters')
          else if (_tryOnStudioStatus != null)
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
                    color: _line,
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

  /// Brightness only. Sheer Skin was a DeepAR pass and no longer applies.
  Widget _brightnessPill() {
    return Container(
      width: 132,
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: _line),
      ),
      child: Row(
        children: [
          const Icon(Icons.light_mode_outlined, size: 14, color: _muted),
          Expanded(
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 2,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                overlayShape: SliderComponentShape.noOverlay,
              ),
              child: Slider(
                value: _brightness,
                min: -0.5,
                max: 0.5,
                activeColor: _pink,
                inactiveColor: _line,
                onChanged: (v) => setState(() => _brightness = v),
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
        children: [const Spacer(), _brightnessPill()],
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

  /// Shades after the search box and the favourites toggle.
  List<LookItem> get _visibleLooks {
    var looks = _presets;
    if (_favouritesOnly) {
      looks = looks
          .where((l) => _favoritePresetNames.contains(l.name))
          .toList();
    }
    if (_family != null) {
      looks = looks.where((l) => l.family == _family).toList();
    }
    if (_shadeQuery.trim().isEmpty) return looks;
    final q = _shadeQuery.trim().toLowerCase();
    return looks.where((l) => l.name.toLowerCase().contains(q)).toList();
  }

  Widget _tryLooksPanel() {
    final looks = _visibleLooks;
    final current = _currentLook;
    final families = _families;

    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_singleLookMode)
            _singleLookHeader(current, looks.length)
          else
            _categoryPicker(),
          const SizedBox(height: 8),
          // The header, search field and family chips stay put whatever the
          // filters return. Hiding them when a query matched nothing left no
          // way to edit or clear the search.
          Row(
            children: [
              Expanded(
                child: Text(
                  looks.isEmpty
                      ? 'No matching shades'
                      : '${current.name}  ·  ${_presetIndex + 1}/${looks.length}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              if (!_singleLookMode) ...[
                _tinyIcon(
                  _searchOpen ? Icons.close : Icons.search,
                  () => setState(() {
                    _searchOpen = !_searchOpen;
                    if (!_searchOpen) {
                      _shadeQuery = '';
                      _searchController.clear();
                    }
                  }),
                ),
                const SizedBox(width: 6),
                _tinyIcon(
                  _favoritePresetNames.contains(current.name)
                      ? Icons.favorite
                      : Icons.favorite_border,
                  _toggleFavoritePreset,
                ),
                const SizedBox(width: 6),
                _beforeIcon(),
                const SizedBox(width: 6),
                _captureButton(size: 34),
              ],
            ],
          ),
          if (_searchOpen && !_singleLookMode) ...[
            const SizedBox(height: 7),
            _shadeSearchRow(),
          ],
          if (!_singleLookMode && families.length > 1) ...[
            const SizedBox(height: 7),
            SizedBox(height: 25, child: _familyChips()),
          ],
          if (!_singleLookMode || _shadesOpen) ...[
            const SizedBox(height: 7),
            SizedBox(
              // Tall enough that the selected swatch's glow is not clipped.
              height: 44,
              child: looks.isEmpty
                  ? Center(
                      child: Text(
                        _shadeQuery.trim().isEmpty
                            ? 'No shades here yet'
                            : 'Nothing matches "${_shadeQuery.trim()}"',
                        style: const TextStyle(fontSize: 11, color: _muted),
                      ),
                    )
                  : ListView.builder(
                      controller: _shadeController,
                      scrollDirection: Axis.horizontal,
                      padding: EdgeInsets.zero,
                      itemExtent: _swatchExtent,
                      itemCount: looks.length,
                      itemBuilder: (context, index) =>
                          _swatch(looks[index], index),
                    ),
            ),
          ],
        ],
      ),
    );
  }

  /// Colour families present in the current category, in shopping order.
  List<String> get _families {
    const order = ['Pinks', 'Reds', 'Nudes', 'Browns', 'Purples'];
    final present = _presets
        .map((l) => l.family)
        .whereType<String>()
        .toSet();
    return order.where(present.contains).toList();
  }

  /// 234 shades is too many to swipe. Families cut it to a browsable set and
  /// give a reason to come back for the next one.
  Widget _familyChips() {
    final families = _families;
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: families.length + 1,
      separatorBuilder: (_, __) => const SizedBox(width: 6),
      itemBuilder: (context, index) {
        final label = index == 0 ? 'All' : families[index - 1];
        final on = index == 0 ? _family == null : _family == families[index - 1];
        return GestureDetector(
          onTap: () {
            setState(() => _family = index == 0 ? null : families[index - 1]);
            _syncShadeController(0);
            unawaited(_applyPreset(0));
          },
          child: Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: on ? _pink : Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: _line),
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w900,
                color: on ? Colors.white : _ink,
              ),
            ),
          ),
        );
      },
    );
  }

  /// Press-and-hold to see the bare face, as a small icon beside capture.
  Widget _beforeIcon() {
    return GestureDetector(
      onLongPressStart: (_) => unawaited(_showBeforeLook()),
      onLongPressEnd: (_) => unawaited(_restoreCurrentLook()),
      onTap: () => _snack('Hold to see before'),
      child: Container(
        width: 32,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: _beforeAfter ? _pink : Colors.white,
          border: Border.all(color: _line),
        ),
        child: Icon(
          Icons.compare,
          size: 15,
          color: _beforeAfter ? Colors.white : _pink,
        ),
      ),
    );
  }

  Widget _shadeSearchRow() {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: _line),
            ),
            child: Row(
              children: [
                const Icon(Icons.search, size: 15, color: _muted),
                const SizedBox(width: 7),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    autofocus: true,
                    textInputAction: TextInputAction.search,
                    onChanged: (value) {
                      setState(() {
                        _shadeQuery = value;
                        _presetIndex = 0;
                      });
                    },
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    cursorColor: _pink,
                    decoration: const InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: 'Search shades',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: _muted,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Opened from a web look card: the look's own name, with its palette kept
  /// behind a Shades menu rather than filling the panel.
  Widget _singleLookHeader(LookItem look, int shadeCount) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                look.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                look.tagLine,
                style: TextStyle(
                  fontSize: 9,
                  letterSpacing: 1.1,
                  fontWeight: FontWeight.w900,
                  color: _pink,
                ),
              ),
            ],
          ),
        ),
        if (shadeCount > 1)
          GestureDetector(
            onTap: () => setState(() => _shadesOpen = !_shadesOpen),
            child: Container(
              height: 34,
              padding: const EdgeInsets.symmetric(horizontal: 13),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: _shadesOpen
                    ? _pink
                    : Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: _line,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Shades ($shadeCount)',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Icon(
                    _shadesOpen
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: _muted,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  /// One circular shade, sized to match the Mix & Match strip.
  Widget _swatch(LookItem item, int index) {
    final selected = index == _presetIndex;
    final fill = item.lipColor ?? _pink;
    final edge = item.hasLiner ? (item.linerColor ?? _berry) : fill;

    return Center(
      child: GestureDetector(
        onTap: () => _selectShade(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: selected ? 34 : 29,
          height: selected ? 34 : 29,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [fill, edge],
            ),
            border: Border.all(
              color: selected ? Colors.white : _line,
              width: selected ? 2.2 : 1,
            ),
            boxShadow: selected
                ? [
                  BoxShadow(
                    color: _pink.withValues(alpha: 0.45),
                    blurRadius: 7,
                    spreadRadius: 0.5,
                  ),
                ]
                : null,
          ),
        ),
      ),
    );
  }

  /// The makeup slots, in the order they are applied. Each maps to a TryOn
  /// Studio region and the catalog group that supplies its shades.
  static const List<Map<String, String>> _mixSlotDefs = [
    {'region': 'lips', 'label': 'Lipstick', 'group': 'lip_swatches'},
    {'region': 'lipliner', 'label': 'Lip Liner', 'group': 'tog_liners'},
    {'region': 'cheeks', 'label': 'Blush', 'group': 'blush_swatches'},
    {'region': 'eyes', 'label': 'Eyeshadow', 'group': 'full_face'},
    {'region': 'liner', 'label': 'Eyeliner', 'group': 'eye_liners'},
    {'region': 'lashes', 'label': 'Lashes', 'group': 'eye_liners'},
  ];

  // Served from the app's own renderer bundle; remote photos tainted the
  // canvas and needed the network.
  static const List<Map<String, String>> _faceModels = [
    {'name': 'Live', 'url': ''},
    {'name': 'Muse', 'url': 'faces/muse.jpg'},
    {'name': 'Amara', 'url': 'faces/amara.jpg'},
    {'name': 'Elena', 'url': 'faces/elena.jpg'},
    {'name': 'Chloe', 'url': 'faces/chloe.jpg'},
  ];

  /// Swaps the renderer between the live camera and a bundled model photo.
  Future<void> _setMixSource(String? url) async {
    setState(() => _mixModelUrl = url);
    final channel = _tryOnStudioNativeChannel;
    if (channel == null) return;
    try {
      await channel.invokeMethod<void>('setSource', {'url': url});
    } catch (e, st) {
      log('Model source switch failed: $e', stackTrace: st);
    }
  }

  List<LookItem> _shadesFor(String groupKey) {
    for (final category in _categories) {
      if (category.key == groupKey) return category.items;
    }
    return const <LookItem>[];
  }

  Widget _buildPanel() {
    final slot = _mixSlotDefs[_mixCategory];
    final region = slot['region']!;
    final items = _shadesFor(slot['group']!);

    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text(
                'Mix & Match',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
              ),
              const Spacer(),
              _mixSourceButton(),
              const SizedBox(width: 6),
              _tinyIcon(Icons.layers_clear_outlined, () {
                setState(_mixSlots.clear);
                unawaited(_applyMixAndMatch());
              }),
              const SizedBox(width: 6),
              _tinyIcon(Icons.bookmark_add_outlined, _saveBuildLook),
              const SizedBox(width: 6),
              _beforeIcon(),
              const SizedBox(width: 6),
              _captureButton(size: 34),
            ],
          ),
          if (_savedLooks.isNotEmpty || _webPresets.isNotEmpty) ...[
            const SizedBox(height: 7),
            SizedBox(height: 42, child: _presetCards()),
          ],
          const SizedBox(height: 7),
          SizedBox(height: 25, child: _mixCategoryChips()),
          const SizedBox(height: 4),
          _mixStrip(items, _mixSlots[region], (item) {
            setState(() => _mixSlots[region] = item);
            unawaited(_applyMixAndMatch());
          }),
        ],
      ),
    );
  }

  Widget _tinyIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          border: Border.all(color: _line),
        ),
        child: Icon(icon, size: 15, color: _pink),
      ),
    );
  }

  /// Category chips keep one strip on screen instead of six.
  Widget _mixCategoryChips() {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: _mixSlotDefs.length,
      separatorBuilder: (_, __) => const SizedBox(width: 6),
      itemBuilder: (context, index) {
        final def = _mixSlotDefs[index];
        final on = index == _mixCategory;
        final picked = _mixSlots[def['region']!];
        return GestureDetector(
          onTap: () => setState(() => _mixCategory = index),
          child: Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 11),
            decoration: BoxDecoration(
              color: on ? _pink : Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: _line),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (picked != null) ...[
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: picked.lipColor ?? _pink,
                    ),
                  ),
                  const SizedBox(width: 5),
                ],
                Text(
                  def['label']!,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                    color: on ? Colors.white : _ink,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Opens the model picker: live camera, or a bundled portrait to try the
  /// look on instead of your own face.
  Widget _mixSourceButton() {
    final current = _faceModels.firstWhere(
      (m) => (m['url']!.isEmpty ? null : m['url']) == _mixModelUrl,
      orElse: () => _faceModels.first,
    );
    return GestureDetector(
      onTap: _showModelPicker,
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 11),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: _line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _mixModelUrl == null
                  ? Icons.photo_camera_outlined
                  : Icons.face_retouching_natural,
              size: 14,
              color: _pink,
            ),
            const SizedBox(width: 5),
            Text(
              current['name']!,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showModelPicker() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
        decoration: const BoxDecoration(
          color: Color(0xfff7f2ef),
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Try it on',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                for (final model in _faceModels) ...[
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.of(sheetContext).pop();
                        final url = model['url']!.isEmpty
                            ? null
                            : model['url'];
                        unawaited(_setMixSource(url));
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: (model['url']!.isEmpty
                                        ? null
                                        : model['url']) ==
                                    _mixModelUrl
                                ? _pink
                                : _line,
                            width: (model['url']!.isEmpty
                                        ? null
                                        : model['url']) ==
                                    _mixModelUrl
                                ? 1.6
                                : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              model['url']!.isEmpty
                                  ? Icons.photo_camera_outlined
                                  : Icons.person_outline,
                              size: 18,
                              color: _pink,
                            ),
                            const SizedBox(height: 5),
                            Text(
                              model['name']!,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _presetCards() {
    if (_savedLooks.isNotEmpty) {
      return ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _savedLooks.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final look = _savedLooks[index];
          return _presetCard(
            look['name'] as String? ?? 'Saved look',
            parseHexColor(look['lip'] as String?) ?? _pink,
            parseHexColor(look['blush'] as String?) ?? _berry,
            () => unawaited(_applySavedLook(look)),
          );
        },
      );
    }
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: _webPresets.length,
      separatorBuilder: (_, __) => const SizedBox(width: 8),
      itemBuilder: (context, index) {
        final preset = _webPresets[index];
        return _presetCard(
          preset.name,
          parseHexColor(preset.lipColor) ?? _pink,
          parseHexColor(preset.blushColor) ?? _berry,
          () => unawaited(_applyWebPreset(preset)),
        );
      },
    );
  }

  Widget _presetCard(String name, Color lip, Color blush, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 104,
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: _line),
        ),
        child: Row(
          children: [
            _dot(lip),
            const SizedBox(width: 4),
            _dot(blush),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 9,
                  height: 1.15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dot(Color color) {
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        border: Border.all(color: _line),
      ),
    );
  }

  Widget _mixStrip(
    List<LookItem> items,
    LookItem? selected,
    ValueChanged<LookItem> onPick,
  ) {
    if (items.isEmpty) {
      return const SizedBox(
        height: 38,
        child: Center(
          child: Text(
            'No shades loaded',
            style: TextStyle(fontSize: 11, color: _muted),
          ),
        ),
      );
    }
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemExtent: 42,
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          final isOn = selected?.assetPath == item.assetPath &&
              selected?.name == item.name;
          return Center(
            child: GestureDetector(
              onTap: () => onPick(item),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 140),
                width: isOn ? 34 : 29,
                height: isOn ? 34 : 29,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: item.lipColor ?? _pink,
                  boxShadow: isOn
                      ? [
                        BoxShadow(
                          color: _pink.withValues(alpha: 0.45),
                          blurRadius: 7,
                          spreadRadius: 0.5,
                        ),
                      ]
                      : null,
                  border: Border.all(
                    color: isOn ? Colors.white : _line,
                    width: isOn ? 2.2 : 1,
                  ),
                ),
              ),
            ),
          );
        },
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
          border: Border.all(color: Colors.white),
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
        side: BorderSide(color: _line),
      ),
      onSelected: _selectCategory,
      itemBuilder: (context) => _categoryMenuEntries(),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _line),
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
                color: _muted,
              ),
            ),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 22,
              color: _muted,
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
                  color: _muted,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return entries;
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
                  : Colors.white,
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

  /// A small confirmation: a tick and one word, not the technical detail.
  void _confirmToast(bool ok, String message) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context)..clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        duration: const Duration(milliseconds: 1400),
        margin: const EdgeInsets.only(bottom: 120, left: 90, right: 90),
        content: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: _line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.10),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  ok ? Icons.check_circle : Icons.error_outline,
                  size: 17,
                  color: ok ? const Color(0xff2e9e63) : _pink,
                ),
                const SizedBox(width: 7),
                Text(
                  message,
                  style: const TextStyle(
                    color: _ink,
                    fontSize: 13,
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

  /// Catalog id, used when a web card asks for one specific look.
  final String id;

  /// Colour family: Pinks, Reds, Nudes, Purples, Corals, Browns.
  final String? family;

  const LookItem(this.name, this.assetPath)
    : kind = LookItemKind.deepar,
      lipColor = null,
      linerColor = null,
      finish = '',
      hasLiner = false,
      hasGloss = false,
      hasShimmer = false,
      shade = null,
      id = '',
      family = null;

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
    this.id = '',
    this.family,
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
      id: json['id'] as String? ?? '',
      family: json['family'] as String?,
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

/// A saved look from the web app's built_looks collection.
class WebPreset {
  final String name;
  final String? lipColor;
  final String? blushColor;
  final String? eyeColor;

  const WebPreset({
    required this.name,
    this.lipColor,
    this.blushColor,
    this.eyeColor,
  });

  factory WebPreset.fromJson(Map<String, dynamic> json) => WebPreset(
    name: json['name'] as String? ?? 'Look',
    lipColor: json['lipColor'] as String?,
    blushColor: json['blushColor'] as String?,
    eyeColor: json['eyeshadowColor'] as String?,
  );
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
