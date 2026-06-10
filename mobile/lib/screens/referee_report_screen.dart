import 'package:flutter/material.dart';
import '../ui/app_theme.dart';
import '../ui/app_widgets.dart';

class RefereeReportScreen extends StatelessWidget {
  const RefereeReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Biên bản trọng tài',
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Báo cáo trận đấu', style: context.typography.h1),
          const SizedBox(height: 6),
          Text(
            'Gửi báo cáo và ghi nhận chính thức của bạn cho trận đấu.',
            style: context.typography.bodyMuted,
          ),
          const SizedBox(height: 24),
          GlassCard(
            accentColor: context.colors.info,
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
                        color: context.colors.infoLight,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Icon(Icons.description_outlined,
                          size: 18, color: context.colors.info),
                    ),
                    const SizedBox(width: 12),
                    Text('Gửi báo cáo', style: context.typography.h3),
                  ],
                ),
                const SizedBox(height: 16),
                Container(height: 1, color: context.colors.border),
                const SizedBox(height: 14),
                Text(
                  'Chức năng báo cáo trận đấu được xử lý thông qua cổng thông tin điện tử trên web.',
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
