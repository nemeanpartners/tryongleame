import 'dart:math' as math;

import 'package:flutter/material.dart';

const _ink = Color(0xff2a1715);
const _muted = Color(0xff8a8079);
const _pink = Color(0xffe0577f);
const _petal = Color(0xfff7c6d7);
const _cream = Color(0xfff7f2ef);
const _line = Color(0xffe6dcd6);

/// The first thing a new install shows: a wrapped box that has to be opened.
///
/// An app that explains itself in a list gets skipped. Pulling the ribbon is
/// one small thing to do before anything is read, and by the time the box is
/// open the person has already used the app once.
class OnboardingOverlay extends StatefulWidget {
  const OnboardingOverlay({
    super.key,
    required this.onSignIn,
    required this.onExplore,
  });

  /// Take me to an account.
  final VoidCallback onSignIn;

  /// Let me look around first.
  final VoidCallback onExplore;

  @override
  State<OnboardingOverlay> createState() => _OnboardingOverlayState();
}

class _OnboardingOverlayState extends State<OnboardingOverlay>
    with TickerProviderStateMixin {
  /// How far the ribbon has been pulled, 0 to 1.
  double _pull = 0;
  bool _opened = false;
  int _step = 0;

  late final AnimationController _openController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );

  /// The three things worth knowing before the first look around.
  static const _steps = [
    (
      title: 'Try it on, properly',
      body:
          'Real shades on your own face, live. Swipe through a catalogue of '
          'lipsticks, liners and lashes and wear any of them.',
    ),
    (
      title: 'Build your own',
      body:
          'Mix & Match puts every product on one face. Pick a lip, a blush, a '
          'liner - or open the colour wheel and make a shade nobody sells.',
    ),
    (
      title: 'Ask for what does not exist',
      body:
          'Vote for the shades you want made, fuse two into one nobody has '
          'yet, and pledge to buy the ones you would actually wear.',
    ),
  ];

  @override
  void dispose() {
    _openController.dispose();
    super.dispose();
  }

  void _release() {
    if (_pull > 0.55) {
      setState(() => _opened = true);
      _openController.forward();
    } else {
      setState(() => _pull = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _cream,
      child: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 420),
          child: _opened ? _tour() : _giftBox(),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- the box

  Widget _giftBox() {
    final lift = _pull * 26;

    return Column(
      key: const ValueKey('box'),
      children: [
        const Spacer(),
        const Text(
          'WELCOME TO',
          style: TextStyle(
            fontSize: 11,
            letterSpacing: 4,
            fontWeight: FontWeight.w900,
            color: _muted,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Gleame',
          style: TextStyle(
            fontSize: 42,
            fontWeight: FontWeight.w900,
            letterSpacing: -1,
            color: _ink,
          ),
        ),
        const SizedBox(height: 34),

        GestureDetector(
          onVerticalDragUpdate: (details) {
            setState(() {
              _pull = (_pull + details.delta.dy / 150).clamp(0.0, 1.0);
            });
          },
          onVerticalDragEnd: (_) => _release(),
          onTap: () {
            // A tap works too, for anyone who does not try the pull.
            setState(() => _pull = 1);
            _release();
          },
          child: SizedBox(
            width: 250,
            height: 280,
            child: Stack(
              alignment: Alignment.topCenter,
              children: [
                // The box
                Positioned(
                  top: 70,
                  child: Container(
                    width: 210,
                    height: 150,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: _line),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x1a2a1715),
                          blurRadius: 26,
                          offset: Offset(0, 12),
                        ),
                      ],
                    ),
                  ),
                ),

                // The lid, which lifts as the ribbon comes away
                Positioned(
                  top: 52 - lift,
                  child: Transform.rotate(
                    angle: _pull * 0.06,
                    child: Container(
                      width: 226,
                      height: 34,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _line),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x142a1715),
                            blurRadius: 14,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // The ribbon down the front, shortening as it is pulled
                Positioned(
                  top: 52,
                  child: Opacity(
                    opacity: 1 - _pull * 0.8,
                    child: Container(
                      width: 30,
                      height: 168 * (1 - _pull * 0.4),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [_petal, _pink],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),

                // The bow, which is the thing to take hold of
                Positioned(
                  top: 18 + _pull * 150,
                  child: Transform.rotate(
                    angle: _pull * 0.5,
                    child: Opacity(
                      opacity: 1 - _pull * 0.55,
                      child: CustomPaint(
                        size: const Size(120, 70),
                        painter: _BowPainter(),
                      ),
                    ),
                  ),
                ),

                // What it says to do
                Positioned(
                  bottom: 0,
                  child: Opacity(
                    opacity: 1 - _pull,
                    child: Column(
                      children: [
                        Icon(
                          Icons.keyboard_double_arrow_down_rounded,
                          size: 20,
                          color: _pink.withValues(alpha: 0.8),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'PULL THE RIBBON',
                          style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 2.4,
                            fontWeight: FontWeight.w900,
                            color: _muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const Spacer(),
      ],
    );
  }

  // --------------------------------------------------------------- the tour

  Widget _tour() {
    final step = _steps[_step];
    final isLast = _step == _steps.length - 1;

    return Padding(
      key: const ValueKey('tour'),
      padding: const EdgeInsets.fromLTRB(26, 12, 26, 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.topRight,
            child: TextButton(
              onPressed: widget.onExplore,
              child: const Text(
                'Skip',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: _muted,
                ),
              ),
            ),
          ),

          const Spacer(),

          // A swatch becomes a product, and the product goes to the vote.
          SizedBox(
            height: 150,
            child: _StepArt(step: _step),
          ),

          const SizedBox(height: 30),
          Text(
            step.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
              color: _ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            step.body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13.5,
              height: 1.5,
              fontWeight: FontWeight.w500,
              color: _muted,
            ),
          ),

          const Spacer(),

          // Where in the tour this is
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < _steps.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _step ? 22 : 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: i == _step ? _pink : _line,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          if (!isLast)
            _primaryButton('Next', () => setState(() => _step += 1))
          else ...[
            _primaryButton('Create an account', widget.onSignIn),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: widget.onExplore,
              child: Container(
                height: 50,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: _line),
                ),
                child: const Text(
                  'Just look around',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: _ink,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Saving looks and voting need an account.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: _muted,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _primaryButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 52,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: _pink,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

/// The bow on top of the box.
class _BowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(colors: [_petal, _pink])
          .createShader(Offset.zero & size);
    final centre = Offset(size.width / 2, size.height * 0.55);

    // Two loops and two tails, which is all a bow is.
    for (final side in [-1.0, 1.0]) {
      final path = Path()
        ..moveTo(centre.dx, centre.dy)
        ..cubicTo(
          centre.dx + side * 52,
          centre.dy - 40,
          centre.dx + side * 54,
          centre.dy + 18,
          centre.dx,
          centre.dy,
        );
      canvas.drawPath(path, paint);

      final tail = Path()
        ..moveTo(centre.dx, centre.dy)
        ..lineTo(centre.dx + side * 20, size.height)
        ..lineTo(centre.dx + side * 6, size.height)
        ..close();
      canvas.drawPath(tail, paint);
    }

    canvas.drawCircle(centre, 9, Paint()..color = _pink);
    canvas.drawCircle(
      centre.translate(-3, -3),
      3,
      Paint()..color = Colors.white.withValues(alpha: 0.45),
    );
  }

  @override
  bool shouldRepaint(_BowPainter oldDelegate) => false;
}

/// One small animation per step: swatches, then a product, then a vote.
class _StepArt extends StatefulWidget {
  const _StepArt({required this.step});

  final int step;

  @override
  State<_StepArt> createState() => _StepArtState();
}

class _StepArtState extends State<_StepArt>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat();

  static const _shades = [
    Color(0xffc3172b),
    Color(0xffc08272),
    Color(0xff7b1f2b),
    Color(0xffb94a63),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        return Stack(
          alignment: Alignment.center,
          children: [
            // The four shades, circling in
            for (var i = 0; i < _shades.length; i++)
              _swatch(i, t),

            // What they are going into
            Container(
              width: 86,
              height: 86,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: _line),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x142a1715),
                    blurRadius: 18,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(
                switch (widget.step) {
                  0 => Icons.face_retouching_natural,
                  1 => Icons.auto_awesome,
                  _ => Icons.how_to_vote_outlined,
                },
                size: 34,
                color: _pink,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _swatch(int index, double t) {
    // Each one falls in on its own beat and settles on the ring.
    final phase = ((t + index / _shades.length) % 1.0);
    final angle = (index / _shades.length) * 2 * math.pi - math.pi / 2;
    final radius = 78 - math.sin(phase * math.pi) * 34;
    final opacity = (math.sin(phase * math.pi) * 1.4).clamp(0.25, 1.0);

    return Transform.translate(
      offset: Offset(math.cos(angle) * radius, math.sin(angle) * radius),
      child: Opacity(
        opacity: opacity,
        child: Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: _shades[index],
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: _shades[index].withValues(alpha: 0.35),
                blurRadius: 10,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
