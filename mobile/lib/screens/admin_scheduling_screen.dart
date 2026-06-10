import 'package:flutter/material.dart';
import '../ui/app_theme.dart';
import '../ui/app_widgets.dart';

class AdminSchedulingScreen extends StatelessWidget {
  const AdminSchedulingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Lập lịch',
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Quản lý lịch trình', style: context.typography.h1),
          const SizedBox(height: 6),
          Text(
            'Quản lý lịch thi đấu và lịch trình giải đấu.',
            style: context.typography.bodyMuted,
          ),
          const SizedBox(height: 24),
          GlassCard(
            accentColor: context.colors.purple,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: context.colors.purpleLight,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Icon(Icons.calendar_month_outlined,
                          size: 18, color: context.colors.purple),
                    ),
                    const SizedBox(width: 12),
                    Text('Lịch thi đấu', style: context.typography.h3),
                  ],
                ),
                const SizedBox(height: 16),
                Container(height: 1, color: context.colors.border),
                const SizedBox(height: 14),
                Text(
                  'Các tính năng lập lịch được quản lý thông qua trang quản trị trên Web.',
                  style: context.typography.bodyMuted,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
