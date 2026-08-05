import 'package:flutter_test/flutter_test.dart';
import 'package:gleame/main.dart';

void main() {
  testWidgets('Gleame opens to AR Presets', (WidgetTester tester) async {
    await tester.pumpWidget(const GleameApp());
    expect(find.text('AR Presets'), findsOneWidget);
    expect(find.text('Build Look'), findsOneWidget);
  });
}
