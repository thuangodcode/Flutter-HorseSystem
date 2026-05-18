import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/state/mock_app_state.dart';
import 'core/theme/app_theme.dart';
import 'features/navigation/presentation/screens/main_navigation_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MockAppState()),
      ],
      child: const HorseRacingApp(),
    ),
  );
}

class HorseRacingApp extends StatelessWidget {
  const HorseRacingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Horse Racing Tournament',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const MainNavigationScreen(),
    );
  }
}
