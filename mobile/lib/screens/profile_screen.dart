import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/job_service.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _confirmSignOut(BuildContext context, JobService jobService) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF131B2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: Color(0xFFF87171), size: 22),
            SizedBox(width: 10),
            Text('Sign Out', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Are you sure you want to sign out from the technician app? You will need to verify your phone number via SMS to sign back in.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context); // pop profile screen
              jobService.signOut();
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobService = context.watch<JobService>();
    final tech = jobService.currentTechnician;

    return Scaffold(
      backgroundColor: const Color(0xFF0B1222),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131B2E),
        elevation: 0,
        title: const Text(
          'Technician Profile',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            tooltip: 'Settings & About',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF94A3B8)),
            tooltip: 'Refresh Profile',
            onPressed: () {
              jobService.fetchAvailableTechnicians();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Roster profile refreshed from Cloud Firestore'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
      body: tech == null
          ? const Center(
              child: Text(
                'No profile active',
                style: TextStyle(color: Color(0xFF94A3B8)),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Profile Header Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF131B2E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF2A374F)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            CircleAvatar(
                              radius: 44,
                              backgroundColor: const Color(0xFF2563EB),
                              backgroundImage: tech.photoUrl.isNotEmpty ? NetworkImage(tech.photoUrl) : null,
                              child: tech.photoUrl.isEmpty
                                  ? Text(
                                      tech.name.isNotEmpty ? tech.name[0] : 'T',
                                      style: const TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    )
                                  : null,
                            ),
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, size: 14, color: Colors.white),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          tech.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 18),
                            const SizedBox(width: 4),
                            Text(
                              tech.rating.toStringAsFixed(2),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFFBBF24),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text('•', style: TextStyle(color: Color(0xFF64748B))),
                            const SizedBox(width: 8),
                            Text(
                              tech.status.replaceAll('_', ' ').toUpperCase(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF38BDF8),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Quick Stats Row (No battery level)
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.task_alt_rounded,
                          iconColor: const Color(0xFF10B981),
                          value: '${tech.completedJobsCount}',
                          label: 'Completed Jobs',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.work_outline_rounded,
                          iconColor: const Color(0xFFA855F7),
                          value: '${jobService.jobs.length}',
                          label: 'Active Jobs',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.star_rounded,
                          iconColor: const Color(0xFFFBBF24),
                          value: tech.rating.toStringAsFixed(1),
                          label: 'Service Rating',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Corporate Details
                  _buildSectionTitle('CORPORATE'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF131B2E),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF2A374F)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoTile(
                          icon: Icons.email_outlined,
                          iconColor: const Color(0xFF38BDF8),
                          title: 'Corporate Email',
                          subtitle: tech.email.trim().isNotEmpty ? tech.email.trim() : 'No email',
                        ),
                        const Divider(height: 1, color: Color(0xFF1E293B)),
                        _buildInfoTile(
                          icon: Icons.phone_android_rounded,
                          iconColor: const Color(0xFF10B981),
                          title: 'Registered Mobile',
                          subtitle: tech.phone,
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF065F46),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified_user_rounded, size: 12, color: Color(0xFF34D399)),
                                SizedBox(width: 4),
                                Text(
                                  'VERIFIED',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF34D399),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Divider(height: 1, color: Color(0xFF1E293B)),
                        _buildInfoTile(
                          icon: Icons.storefront_rounded,
                          iconColor: const Color(0xFFF59E0B),
                          title: 'Assigned Branch Hub',
                          subtitle: tech.branchId == 'branch_mg_road'
                              ? 'Image Mobiles - M.G. Road Branch'
                              : 'Image Mobiles - Edappally Central Hub',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Vehicle & Mobility Details
                  _buildSectionTitle('MOBILITY & VEHICLE'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF131B2E),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF2A374F)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoTile(
                          icon: Icons.two_wheeler_rounded,
                          iconColor: const Color(0xFF10B981),
                          title: 'Service Vehicle',
                          subtitle: tech.vehicleType,
                        ),
                        const Divider(height: 1, color: Color(0xFF1E293B)),
                        _buildInfoTile(
                          icon: Icons.badge_outlined,
                          iconColor: const Color(0xFF38BDF8),
                          title: 'Registration Number',
                          subtitle: tech.vehicleNumber,
                        ),
                        const Divider(height: 1, color: Color(0xFF1E293B)),
                        _buildInfoTile(
                          icon: Icons.gps_fixed_rounded,
                          iconColor: jobService.isGpsBroadcasting ? const Color(0xFF10B981) : const Color(0xFF64748B),
                          title: 'Live Telemetry',
                          subtitle: '${tech.latitude.toStringAsFixed(4)}° N, ${tech.longitude.toStringAsFixed(4)}° E',
                          trailing: Text(
                            jobService.isGpsBroadcasting ? 'ACTIVE (12s)' : 'STANDBY',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: jobService.isGpsBroadcasting ? const Color(0xFF10B981) : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Certified Skills
                  if (tech.skills.isNotEmpty) ...[
                    _buildSectionTitle('SPECIALIZATIONS & CERTIFICATIONS'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: tech.skills.map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 14, color: Color(0xFF38BDF8)),
                              const SizedBox(width: 6),
                              Text(
                                skill,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFF1F5F9),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Application & Settings Section
                  _buildSectionTitle('APPLICATION & SETTINGS'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF131B2E),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF2A374F)),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.settings_outlined, color: Color(0xFF38BDF8), size: 20),
                      ),
                      title: const Text(
                        'Settings & About',
                        style: TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Preferences, Privacy Policy, Terms of Service',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                      ),
                      trailing: const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SettingsScreen()),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Sign Out Button
                  ElevatedButton.icon(
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: const Text(
                      'Sign Out of Field App',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
                      foregroundColor: const Color(0xFFF87171),
                      side: const BorderSide(color: Color(0xFFEF4444)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: () => _confirmSignOut(context, jobService),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
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

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF131B2E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2A374F)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10.5,
              color: Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }
}
