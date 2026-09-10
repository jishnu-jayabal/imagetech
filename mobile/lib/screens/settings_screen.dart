import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;
  bool _alertSounds = true;
  bool _highAccuracyGps = true;
  bool _offlineCache = true;

  void _showPrivacyPolicy(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF131B2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, scrollCtrl) => Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollCtrl,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.privacy_tip_outlined, color: Color(0xFF38BDF8), size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Privacy Policy',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Color(0xFF1E293B)),
              const SizedBox(height: 10),
              _buildLegalHeading('1. Field Location & GPS Tracking'),
              _buildLegalParagraph(
                'When On Duty or actively responding to a service ticket, this application broadcasts high-precision GPS coordinates to central dispatch and the customer tracking portal. Tracking stops when you toggle your status to Offline.',
              ),
              _buildLegalHeading('2. Customer Contact & Sensitive Data'),
              _buildLegalParagraph(
                'Customer phone numbers, addresses, and device serial numbers accessed via this application must only be used for the direct execution of doorstep diagnostic and repair visits. Sharing or exporting customer data is strictly prohibited.',
              ),
              _buildLegalHeading('3. Device Camera & Inspection Photos'),
              _buildLegalParagraph(
                'Diagnostic photos, physical damage proof, and final handover signatures captured through this app are securely uploaded to Image Mobiles Cloud Storage for warranty and insurance audit purposes.',
              ),
              _buildLegalHeading('4. Data Retention & Access Rights'),
              _buildLegalParagraph(
                'Audit logs and location timestamps are retained for 90 days in compliance with company security standards. You may review your shift history with your branch manager.',
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  void _showTermsOfService(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF131B2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, scrollCtrl) => Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollCtrl,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.gavel_rounded, color: Color(0xFF10B981), size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Terms of Service',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Color(0xFF1E293B)),
              const SizedBox(height: 10),
              _buildLegalHeading('1. Technician Code of Conduct'),
              _buildLegalParagraph(
                'Technicians represent Image Mobiles during all customer doorstep visits. Wear the official uniform badge, maintain professional decorum, and present digital estimates before opening any customer hardware.',
              ),
              _buildLegalHeading('2. Dispatch Acceptance & Response Times'),
              _buildLegalParagraph(
                'Assigned priority tickets must be acknowledged within 15 minutes. In the event of vehicle breakdowns or traffic delays, update your status immediately to alert branch dispatch.',
              ),
              _buildLegalHeading('3. Spare Parts & Replacement Guarantees'),
              _buildLegalParagraph(
                'Only genuine OEM parts issued from authorized Image Mobiles branch hubs may be fitted. Returned defective parts must be checked into the branch inventory within 24 hours.',
              ),
              _buildLegalHeading('4. Device Safety & Custody in Transit'),
              _buildLegalParagraph(
                'Devices rescheduled for in-shop lab repairs must be sealed in anti-static protective pouches with the printed Job Intake QR code attached.',
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  static Widget _buildLegalHeading(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Color(0xFFE2E8F0),
        ),
      ),
    );
  }

  static Widget _buildLegalParagraph(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12.5,
        color: Color(0xFF94A3B8),
        height: 1.5,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1222),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131B2E),
        elevation: 0,
        title: const Text(
          'Settings & About',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Section: Preferences & Options
          _buildSectionHeader('PREFERENCES & APP OPTIONS'),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2A374F)),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: _pushNotifications,
                  activeThumbColor: const Color(0xFF38BDF8),
                  title: const Text('Push Notifications', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Instant alerts for new job dispatches & status changes', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  secondary: const Icon(Icons.notifications_active_outlined, color: Color(0xFF38BDF8)),
                  onChanged: (val) => setState(() => _pushNotifications = val),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                SwitchListTile(
                  value: _alertSounds,
                  activeThumbColor: const Color(0xFF38BDF8),
                  title: const Text('Sound & Vibration', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Play sound on priority dispatch alerts', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  secondary: const Icon(Icons.volume_up_outlined, color: Color(0xFF10B981)),
                  onChanged: (val) => setState(() => _alertSounds = val),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                SwitchListTile(
                  value: _highAccuracyGps,
                  activeThumbColor: const Color(0xFF38BDF8),
                  title: const Text('High-Accuracy GPS', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Transmit location updates every 12s when On Duty', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  secondary: const Icon(Icons.gps_fixed_rounded, color: Color(0xFFF59E0B)),
                  onChanged: (val) => setState(() => _highAccuracyGps = val),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                SwitchListTile(
                  value: _offlineCache,
                  activeThumbColor: const Color(0xFF38BDF8),
                  title: const Text('Offline Sync Cache', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Cache jobs locally when working in weak signal zones', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  secondary: const Icon(Icons.cloud_sync_outlined, color: Color(0xFFA855F7)),
                  onChanged: (val) => setState(() => _offlineCache = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Section: Legal & Compliance
          _buildSectionHeader('LEGAL & POLICIES'),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2A374F)),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined, color: Color(0xFF38BDF8)),
                  title: const Text('Privacy Policy', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('GPS tracking, customer data, and storage rights', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
                  onTap: () => _showPrivacyPolicy(context),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                ListTile(
                  leading: const Icon(Icons.gavel_rounded, color: Color(0xFF10B981)),
                  title: const Text('Terms of Service', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Technician code of conduct and safety protocols', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
                  onTap: () => _showTermsOfService(context),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                ListTile(
                  leading: const Icon(Icons.verified_outlined, color: Color(0xFFA855F7)),
                  title: const Text('Security & Compliance', style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  subtitle: const Text('End-to-end encrypted dispatch data sync', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('All communications are encrypted over TLS 1.3 to Google Firestore.')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Section: About
          _buildSectionHeader('ABOUT APPLICATION'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2A374F)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF38BDF8)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.build_circle_rounded, color: Colors.white, size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Image Mobiles Field Ops',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Version 1.4.0 (Build 2026.09-Release)',
                          style: TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                const SizedBox(height: 12),
                _buildAboutRow('Organization', 'Image Mobiles & Computers Pvt. Ltd.'),
                _buildAboutRow('Project Environment', 'imagemobiles-45aeb'),
                _buildAboutRow('Central Dispatch Hub', 'Kochi, Kerala, India'),
                _buildAboutRow('Technician Support', 'support@imagemobiles.com'),
                const SizedBox(height: 8),
                const Center(
                  child: Text(
                    '© 2026 Image Mobiles. All rights reserved.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 11,
        letterSpacing: 0.8,
        fontWeight: FontWeight.bold,
        color: Color(0xFF64748B),
      ),
    );
  }

  Widget _buildAboutRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
        ],
      ),
    );
  }
}
