import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:deepar_flutter_plus/deepar_flutter_plus.dart';
import 'package:flutter/material.dart';
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
  static const _iosDeepArKey =
      'cea1c575f20ba165fe73308381a71a6a7ed091a4c5c932f6630662002a33acb5bd7df298ee83b14a2';
  static final Uri _webHomeUri = Uri.parse(
    'https://tryon-beauty.ai.studio/home?embedded=ios',
  );
  static final Uri _webLookLabUri = Uri.parse(
    'https://tryon-beauty.ai.studio/editor?embedded=ios',
  );

  final DeepArControllerPlus _deepArController = DeepArControllerPlus();
  final WebViewController _homeWebController = WebViewController();
  final WebViewController _lookLabWebController = WebViewController();
  final Set<String> _favoritePresetNames = {};

  LabTab _tab = LabTab.tryLooks;
  bool _arInitialized = false;
  bool _arViewCreated = false;
  bool _savingCapture = false;
  bool _cameraDenied = false;
  bool _homeWebReady = false;
  bool _lookLabWebReady = false;
  bool _sheerSkin = false;
  bool _beforeAfter = false;
  double _brightness = 0.10;
  Future<void> _effectQueue = Future<void>.value();
  final Map<String, Timer> _slotDebounceTimers = {};
  final Map<String, String> _activeSlotPaths = {};
  int _presetIndex = 0;
  int _eyeshadowIndex = 0;
  int _eyelinerIndex = 0;
  int _lashIndex = 0;
  int _lipIndex = 0;

  final List<LookItem> _presets = const [
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
    unawaited(_loadSavedState());
    _initializeDeepAr();
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
    unawaited(_deepArController.destroy());
    super.dispose();
  }

  Future<void> _applyPreset(int index) async {
    setState(() => _presetIndex = index);
    await _runEffect(() async {
      await _clearSlots(const [
        'eyeshadow',
        'eyeliner',
        'eyelashes',
        'lips',
        'sheerskin',
      ]);
      final assetPath = _presets[index].assetPath;
      await _deepArController.switchEffect(assetPath);
      _activeSlotPaths['effect'] = assetPath;
      log('Applied preset ${_presets[index].name}: $assetPath');
    });
  }

  Future<void> _toggleFavoritePreset() async {
    final name = _presets[_presetIndex].name;
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
        'preset': _tab == LabTab.tryLooks ? _presets[_presetIndex].name : null,
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

  Future<void> _saveCaptureToPhotos() async {
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
      _beforeAfter = false;
      _eyeshadowIndex = 0;
      _eyelinerIndex = 0;
      _lashIndex = 0;
      _lipIndex = 0;
      _sheerSkin = false;
    });
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
    await _runEffect(() async {
      await _clearSlots(_activeSlotPaths.keys.toList());
      log('Before preview enabled');
    });
  }

  Future<void> _restoreCurrentLook() async {
    if (!_beforeAfter) return;
    setState(() => _beforeAfter = false);
    await _runEffect(() async {
      if (_tab == LabTab.tryLooks) {
        final assetPath = _presets[_presetIndex].assetPath;
        await _deepArController.switchEffect(assetPath);
        _activeSlotPaths['effect'] = assetPath;
        log('Before preview restored preset ${_presets[_presetIndex].name}');
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
    setState(() => _tab = tab);
    if (tab == LabTab.tryLooks) unawaited(_applyPreset(_presetIndex));
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
        ],
      ),
    );
  }

  bool get _isWebTab => _tab == LabTab.home || _tab == LabTab.lab;

  Widget _webWrapperLayer() {
    final loading = _tab == LabTab.home ? !_homeWebReady : !_lookLabWebReady;

    return ColoredBox(
      color: const Color(0xfffaf6f5),
      child: Stack(
        children: [
          Positioned.fill(
            child: IndexedStack(
              index: _tab == LabTab.home ? 0 : 1,
              children: [
                WebViewWidget(controller: _homeWebController),
                WebViewWidget(controller: _lookLabWebController),
              ],
            ),
          ),
          if (loading)
            const Center(child: CircularProgressIndicator(color: _pink)),
        ],
      ),
    );
  }

  Widget _deepArLayer() {
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
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_tab == LabTab.tryLooks) _tryLooksPanel(),
            if (_tab == LabTab.build) _buildPanel(),
            if (_tab == LabTab.lab) _labPanel(),
            const SizedBox(height: 8),
            _lookLabTabs(),
          ],
        ),
      ),
    );
  }

  Widget _tryLooksPanel() {
    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Try Looks', 'Presets with lips, liner and lashes'),
          const SizedBox(height: 8),
          SizedBox(
            height: 34,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _presets.length,
              separatorBuilder: (_, __) => const SizedBox(width: 7),
              itemBuilder:
                  (context, index) => _choiceChip(
                    _presets[index].name,
                    selected: index == _presetIndex,
                    onTap: () => _applyPreset(index),
                  ),
            ),
          ),
          const SizedBox(height: 9),
          Row(
            children: [
              Expanded(child: _beforeAfterControl()),
              const SizedBox(width: 9),
              _miniCircle(
                _favoritePresetNames.contains(_presets[_presetIndex].name)
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

  Widget _labPanel() {
    return _glass(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            'Small Look Lab',
            'Create, vote and challenge friends',
          ),
          const SizedBox(height: 8),
          _labTile(
            Icons.auto_awesome,
            'Request a Look',
            'Ask for a style to build',
          ),
          _labTile(
            Icons.how_to_vote_outlined,
            'Vote next look',
            'Winner credited',
          ),
          _labTile(
            Icons.brush_outlined,
            'Send to My MUA',
            'Creates a shareable image',
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

  Widget _labTile(IconData icon, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: const BoxDecoration(
              color: _pink,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 17),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10, color: Colors.white60),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.white54, size: 20),
        ],
      ),
    );
  }

  Widget _choiceChip(
    String label, {
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: selected ? _pink : _berry.withValues(alpha: 0.88),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color:
                selected
                    ? Colors.white.withValues(alpha: 0.18)
                    : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
        ),
      ),
    );
  }

  Widget _lookLabTabs() {
    return Container(
      height: 58,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.30),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          _tabButton(LabTab.tryLooks, Icons.face_retouching_natural, 'Try'),
          _tabButton(LabTab.build, Icons.palette_outlined, 'Build'),
          _tabButton(LabTab.home, Icons.home_rounded, 'Home'),
          _tabButton(LabTab.lab, Icons.auto_awesome_motion_outlined, 'Lab'),
        ],
      ),
    );
  }

  Widget _tabButton(LabTab tab, IconData icon, String label) {
    final selected = _tab == tab;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _switchTab(tab),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          decoration: BoxDecoration(
            color:
                selected
                    ? Colors.white.withValues(alpha: 0.13)
                    : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color:
                  selected
                      ? Colors.white.withValues(alpha: 0.12)
                      : Colors.transparent,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 19, color: selected ? _pink : Colors.white60),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  color: selected ? _pink : Colors.white60,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
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

class LookItem {
  final String name;
  final String assetPath;
  const LookItem(this.name, this.assetPath);
}
