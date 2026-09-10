import 'package:flutter/material.dart';
import '../models/job_model.dart';

class StatusBadge extends StatelessWidget {
  final JobStatus status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (status) {
      case JobStatus.pendingEstimate:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        break;
      case JobStatus.assigned:
        bg = const Color(0xFFE0F2FE);
        fg = const Color(0xFF0284C7);
        break;
      case JobStatus.inProgress:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF2563EB);
        break;
      case JobStatus.rescheduledShop:
        bg = const Color(0xFFF5F3FF);
        fg = const Color(0xFF7C3AED);
        break;
      case JobStatus.inShop:
        bg = const Color(0xFFFAF5FF);
        fg = const Color(0xFF9333EA);
        break;
      case JobStatus.outForDelivery:
        bg = const Color(0xFFECFEFF);
        fg = const Color(0xFF0891B2);
        break;
      case JobStatus.completed:
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF059669);
        break;
      case JobStatus.cancelled:
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFDC2626);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.displayName.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}
