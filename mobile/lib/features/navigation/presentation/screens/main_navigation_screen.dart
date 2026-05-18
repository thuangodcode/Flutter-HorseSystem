import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../home/presentation/screens/spectator_home_screen.dart';
import '../../../live_race/presentation/screens/live_race_screen.dart';
import '../../../prediction/presentation/screens/prediction_screen.dart';
import '../../../tournament/presentation/screens/tournament_list_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SpectatorHomeScreen(),
    const TournamentListScreen(),
    const LiveRaceScreen(),
    const PredictionScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(color: Color(0xFF2E2E33), width: 1.0),
            ),
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.explore_outlined),
                activeIcon: Icon(Icons.explore, color: AppColors.primary),
                label: 'Khám Phá',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_month_outlined),
                activeIcon: Icon(Icons.calendar_month, color: AppColors.primary),
                label: 'Lịch Đua',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.speed_outlined),
                activeIcon: Icon(Icons.speed, color: AppColors.primary),
                label: 'Live Standings',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.casino_outlined),
                activeIcon: Icon(Icons.casino, color: AppColors.primary),
                label: 'Dự Đoán',
              ),
            ],
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
            unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
          ),
        ),
      ),
    );
  }
}
