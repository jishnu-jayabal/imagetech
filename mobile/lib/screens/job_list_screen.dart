import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/job_model.dart';
import '../services/job_service.dart';
import '../widgets/status_badge.dart';
import 'job_detail_screen.dart';

class JobListScreen extends StatefulWidget {
  const JobListScreen({super.key});

  @override
  State<JobListScreen> createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  int _selectedFilterIndex = 0;
  final List<String> _filters = ['All', 'Assigned', 'In Progress', 'In Shop', 'Completed'];

  void _showNewIntakeDialog(BuildContext context, JobService jobService) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final deviceCtrl = TextEditingController();
    final issueCtrl = TextEditingController();
    final estimateCtrl = TextEditingController(text: '1200');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF131B2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'New Field Service Intake',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text(
                'Creates a job with status "Pending Estimate" auto-assigned to you (PDF Sec 3.3).',
                style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 16),
              _buildInputField('Customer Name *', nameCtrl, 'e.g. Anand Menon'),
              const SizedBox(height: 10),
              _buildInputField('Customer Phone (10 Digits) *', phoneCtrl, 'e.g. 9847012345', keyboardType: TextInputType.phone),
              const SizedBox(height: 10),
              _buildInputField('Service Address & Landmark *', addressCtrl, 'e.g. MG Road, Kochi'),
              const SizedBox(height: 10),
              _buildInputField('Device Brand & Model *', deviceCtrl, 'e.g. iPhone 14 Pro'),
              const SizedBox(height: 10),
              _buildInputField('Issue Description', issueCtrl, 'e.g. Glass cracked, battery service'),
              const SizedBox(height: 10),
              _buildInputField('Estimated Base Cost (₹)', estimateCtrl, '1200', keyboardType: TextInputType.number),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty || deviceCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please fill all required fields.')),
                    );
                    return;
                  }

                  final baseEst = double.tryParse(estimateCtrl.text.trim()) ?? 1200.0;
                  final ok = await jobService.createOnsiteIntakeJob(
                    customerName: nameCtrl.text.trim(),
                    customerPhone: phoneCtrl.text.trim(),
                    customerAddress: addressCtrl.text.trim().isNotEmpty ? addressCtrl.text.trim() : 'Kochi, Kerala',
                    deviceModel: deviceCtrl.text.trim(),
                    issueDescription: issueCtrl.text.trim().isNotEmpty ? issueCtrl.text.trim() : 'Inspection requested',
                    baseEstimate: baseEst,
                  );

                  if (ctx.mounted) Navigator.pop(ctx);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(ok
                            ? 'New service intake logged in Firestore (Pending Estimate).'
                            : 'Intake saved locally.'),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Log Intake & Sync to Firestore', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField(String label, TextEditingController ctrl, String hint, {TextInputType keyboardType = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFFCBD5E1))),
        const SizedBox(height: 4),
        TextField(
          controller: ctrl,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF2A374F))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF2A374F))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF38BDF8))),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobService = context.watch<JobService>();
    final tech = jobService.currentTechnician;
    final allJobs = jobService.jobs;

    // Filter jobs based on selected filter tab
    final filteredJobs = allJobs.where((job) {
      switch (_selectedFilterIndex) {
        case 1: // Assigned
          return job.status == JobStatus.assigned || job.status == JobStatus.pendingEstimate;
        case 2: // In Progress / Transit
          return job.status == JobStatus.inProgress ||
              job.status == JobStatus.rescheduledShop ||
              job.status == JobStatus.outForDelivery;
        case 3: // In Shop
          return job.status == JobStatus.inShop;
        case 4: // Completed
          return job.status == JobStatus.completed;
        case 0: // All
        default:
          return true;
      }
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1222),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131B2E),
        elevation: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF2563EB),
              backgroundImage: (tech?.photoUrl.isNotEmpty ?? false) ? NetworkImage(tech!.photoUrl) : null,
              child: (tech?.photoUrl.isEmpty ?? true)
                  ? Text(tech?.name.isNotEmpty == true ? tech!.name[0] : 'T', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tech?.name ?? 'Technician',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: jobService.isGpsBroadcasting ? const Color(0xFF38BDF8) : const Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        jobService.isGpsBroadcasting ? 'GPS Broadcasting' : (tech?.vehicleNumber ?? 'On Duty'),
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF94A3B8)),
            tooltip: 'Sync Firestore Jobs',
            onPressed: () => jobService.syncJobsFromFirestore(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFF87171)),
            tooltip: 'Sign Out',
            onPressed: () => jobService.signOut(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Live GPS Broadcast Banner
          if (jobService.isGpsBroadcasting)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFF1E3A8A).withOpacity(0.5),
              child: const Row(
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                    ),
                  ),
                  SizedBox(width: 10),
                  Text(
                    'Live GPS active: Streaming coords to Admin & Customer map',
                    style: TextStyle(fontSize: 11.5, color: Color(0xFFBAE6FD), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

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

          // Jobs List View
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => jobService.syncJobsFromFirestore(),
              child: filteredJobs.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.inbox_outlined, size: 54, color: Color(0xFF475569)),
                          const SizedBox(height: 12),
                          Text(
                            'No ${_filters[_selectedFilterIndex]} Jobs',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Jobs assigned to you from Admin will appear here live.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: filteredJobs.length,
                      itemBuilder: (context, index) {
                        final job = filteredJobs[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          color: const Color(0xFF131B2E),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: const BorderSide(color: Color(0xFF2A374F)),
                          ),
                          elevation: 0,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => JobDetailScreen(jobId: job.id),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        job.jobNumber,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: Color(0xFF38BDF8),
                                        ),
                                      ),
                                      StatusBadge(status: job.status),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    '${job.device.brand} ${job.device.model}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    job.customer.address,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                  ),
                                  const Divider(height: 24, color: Color(0xFF1E293B)),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.person_outline, size: 14, color: Color(0xFF94A3B8)),
                                          const SizedBox(width: 4),
                                          Text(
                                            job.customer.name,
                                            style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1), fontWeight: FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        job.formattedTotal,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          color: Color(0xFF34D399),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showNewIntakeDialog(context, jobService),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Field Intake', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
