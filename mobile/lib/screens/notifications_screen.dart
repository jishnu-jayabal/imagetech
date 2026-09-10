import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/job_service.dart';
import 'job_detail_screen.dart';

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final String type; // 'dispatch', 'estimate', 'system', 'customer'
  final DateTime timestamp;
  bool isRead;
  final String? relatedJobId;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
    this.relatedJobId,
  });
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  int _selectedFilterIndex = 0;
  final List<String> _filters = ['All', 'Dispatches', 'Updates', 'System'];

  late List<NotificationItem> _notifications;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _notifications = [
      NotificationItem(
        id: 'notif_1',
        title: 'New Service Job Assigned',
        message: 'Job #IMG-7204 (OnePlus 11 5G Screen Service) has been assigned to your shift by Branch Manager.',
        type: 'dispatch',
        timestamp: now.subtract(const Duration(minutes: 12)),
        isRead: false,
        relatedJobId: 'job_7204',
      ),
      NotificationItem(
        id: 'notif_2',
        title: 'Estimate Approved by Hub',
        message: 'Initial diagnostic quote of ₹1,200 (+GST) was reviewed and approved for field execution.',
        type: 'estimate',
        timestamp: now.subtract(const Duration(hours: 1, minutes: 20)),
        isRead: false,
        relatedJobId: 'job_7204',
      ),
      NotificationItem(
        id: 'notif_3',
        title: 'Live GPS Telemetry Active',
        message: 'Your field location is broadcasting every 12s to central dispatch and customer live map.',
        type: 'system',
        timestamp: now.subtract(const Duration(hours: 3)),
        isRead: true,
      ),
      NotificationItem(
        id: 'notif_4',
        title: 'Proof Photo Requirement Notice',
        message: 'Company guardrail: Please remember to take at least 1 device photo before completing and closing the job.',
        type: 'system',
        timestamp: now.subtract(const Duration(hours: 5)),
        isRead: true,
      ),
    ];
  }

  List<NotificationItem> get _filteredNotifications {
    switch (_selectedFilterIndex) {
      case 1:
        return _notifications.where((n) => n.type == 'dispatch').toList();
      case 2:
        return _notifications.where((n) => n.type == 'estimate' || n.type == 'customer').toList();
      case 3:
        return _notifications.where((n) => n.type == 'system').toList();
      case 0:
      default:
        return _notifications;
    }
  }

  void _markAllAsRead() {
    setState(() {
      for (final n in _notifications) {
        n.isRead = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'dispatch':
        return Icons.assignment_turned_in_rounded;
      case 'estimate':
        return Icons.verified_rounded;
      case 'customer':
        return Icons.person_pin_circle_rounded;
      case 'system':
      default:
        return Icons.notifications_active_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'dispatch':
        return const Color(0xFF38BDF8);
      case 'estimate':
        return const Color(0xFF10B981);
      case 'customer':
        return const Color(0xFFF59E0B);
      case 'system':
      default:
        return const Color(0xFFA855F7);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    return Scaffold(
      backgroundColor: const Color(0xFF0B1222),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131B2E),
        elevation: 0,
        title: Row(
          children: [
            const Text(
              'Notifications',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              icon: const Icon(Icons.done_all_rounded, size: 16, color: Color(0xFF38BDF8)),
              label: const Text(
                'Mark Read',
                style: TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.w600),
              ),
              onPressed: _markAllAsRead,
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: List.generate(_filters.length, (index) {
                final isSelected = _selectedFilterIndex == index;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(_filters[index]),
                    selected: isSelected,
                    selectedColor: const Color(0xFF2563EB),
                    backgroundColor: const Color(0xFF131B2E),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                    side: BorderSide(
                      color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF2A374F),
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    onSelected: (_) => setState(() => _selectedFilterIndex = index),
                  ),
                );
              }),
            ),
          ),

          // Notifications List
          Expanded(
            child: _filteredNotifications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.notifications_none_rounded, size: 56, color: Color(0xFF475569)),
                        const SizedBox(height: 12),
                        const Text(
                          'No Notifications',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'You are all caught up on ${_filters[_selectedFilterIndex].toLowerCase()} alerts.',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    itemCount: _filteredNotifications.length,
                    itemBuilder: (context, index) {
                      final notif = _filteredNotifications[index];
                      final icon = _getIconForType(notif.type);
                      final color = _getColorForType(notif.type);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        color: notif.isRead ? const Color(0xFF131B2E) : const Color(0xFF182238),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: notif.isRead ? const Color(0xFF2A374F) : const Color(0xFF2563EB).withValues(alpha: 0.5),
                          ),
                        ),
                        elevation: 0,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () {
                            setState(() {
                              notif.isRead = true;
                            });
                            if (notif.relatedJobId != null) {
                              final jobService = context.read<JobService>();
                              final job = jobService.getJobById(notif.relatedJobId!);
                              if (job != null) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => JobDetailScreen(jobId: notif.relatedJobId!),
                                  ),
                                );
                              }
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: color.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(icon, color: color, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              notif.title,
                                              style: TextStyle(
                                                fontSize: 13.5,
                                                fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            _formatTime(notif.timestamp),
                                            style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 5),
                                      Text(
                                        notif.message,
                                        style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), height: 1.35),
                                      ),
                                      if (notif.relatedJobId != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Text(
                                              'View Job Dispatch ➔',
                                              style: TextStyle(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.bold,
                                                color: color,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                if (!notif.isRead) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF38BDF8),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
