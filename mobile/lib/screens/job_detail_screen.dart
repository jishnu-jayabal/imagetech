import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/job_model.dart';
import '../services/job_service.dart';
import '../widgets/status_badge.dart';
import 'add_charge_dialog.dart';

class JobDetailScreen extends StatelessWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  Widget build(BuildContext context) {
    final jobService = Provider.of<JobService>(context);
    final job = jobService.getJobById(jobId);

    if (job == null) {
      return const Scaffold(
        body: Center(child: Text('Job not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(job.jobNumber),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(child: StatusBadge(status: job.status)),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // GPS Broadcasting Alert Banner
            if (jobService.isGpsBroadcasting)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.gps_fixed, color: Color(0xFF059669), size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Live GPS Broadcasting Active (Pinging every 12s)',
                        style: TextStyle(
                          color: Color(0xFF065F46),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Device & Customer Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${job.device.brand} ${job.device.model}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Color: ${job.device.color} • ${job.serviceType}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    ),
                    const Divider(height: 24, color: Color(0xFF2A374F)),
                    Row(
                      children: [
                        const Icon(Icons.person_outline, size: 20, color: Color(0xFF38BDF8)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            job.customer.name,
                            style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 14.5),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.phone, color: Color(0xFF10B981)),
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Calling ${job.customer.phone}...')),
                            );
                          },
                        ),
                      ],
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on_outlined, size: 20, color: Color(0xFFF87171)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            job.customer.address,
                            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF2A374F)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.report_problem_outlined, size: 14, color: Color(0xFFFBBF24)),
                              SizedBox(width: 6),
                              Text(
                                'REPORTED ISSUE',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFFBBF24),
                                  letterSpacing: 0.6,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            job.issueDescription,
                            style: const TextStyle(
                              fontSize: 13.5,
                              color: Color(0xFFF1F5F9),
                              height: 1.45,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Itemized Bill Section
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Estimated Bill',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        if (job.status == JobStatus.inProgress)
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add Part'),
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (_) => AddChargeDialog(
                                  onAdd: (title, amount) {
                                    jobService.addAdditionalCharge(job.id, title, amount);
                                  },
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Base Diagnostics & Service:'),
                        Text('₹${job.baseEstimate.toInt()}'),
                      ],
                    ),
                    ...job.additionalCharges.map((ch) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('+ ${ch.title}', style: const TextStyle(color: Color(0xFFD97706))),
                              Text('₹${ch.amount.toInt()}', style: const TextStyle(color: Color(0xFFD97706))),
                            ],
                          ),
                        )),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Running Subtotal:', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text(
                          job.formattedTotal,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Completion Photo Proof
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Proof Photos (Min 1 required to close)', style: TextStyle(fontWeight: FontWeight.bold)),
                        Icon(Icons.camera_alt, color: Colors.grey, size: 18),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        ...job.proofPhotos.map((url) => Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(image: NetworkImage(url), fit: BoxFit.cover),
                              ),
                            )),
                        InkWell(
                          onTap: () {
                            jobService.addProofPhoto(
                              job.id,
                              'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=300&q=80',
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Proof photo attached')),
                            );
                          },
                          child: Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey[400]!, style: BorderStyle.solid),
                            ),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_a_photo, size: 20, color: Colors.grey),
                                Text('Add', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Action Buttons based on Status
            _buildActionButtons(context, jobService, job),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, JobService jobService, Job job) {
    if (job.status == JobStatus.pendingEstimate) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF59E0B)),
        ),
        child: const Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.hourglass_top_rounded, color: Color(0xFFFBBF24), size: 20),
                SizedBox(width: 8),
                Text(
                  'Pending Estimate Approval',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24)),
                ),
              ],
            ),
            SizedBox(height: 6),
            Text(
              'Awaiting Branch Manager review and diagnostic quote approval in the Admin Portal before field dispatch can proceed.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: Color(0xFFCBD5E1), height: 1.4),
            ),
          ],
        ),
      );
    } else if (job.status == JobStatus.assigned) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.navigation_rounded),
          label: const Text('Start Trip & Stream Live GPS', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: () {
            jobService.startTrip(job.id);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Trip started! Live GPS telemetry streaming to Admin & Customer.')),
            );
          },
        ),
      );
    } else if (job.status == JobStatus.inProgress) {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.store_mall_directory_rounded),
                  label: const Text('Transfer to Lab'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF7C3AED),
                    side: const BorderSide(color: Color(0xFF7C3AED)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () {
                    jobService.rescheduleToShop(job.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Status updated: Device in transit to Lab Repair.')),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline_rounded),
                  label: const Text('Complete Onsite'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    if (job.proofPhotos.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please add at least 1 inspection/proof photo before completing the service. Tap "+ Add" above.'),
                          backgroundColor: Color(0xFFDC2626),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      return;
                    }
                    jobService.completeJob(job.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Job marked completed! Tax invoice generated.'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      );
    } else if (job.status == JobStatus.rescheduledShop) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.inventory_2_rounded),
          label: const Text('Device Checked in at Lab Bench', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF9333EA),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: () {
            jobService.markInShop(job.id);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Device checked in to Lab repair. GPS tracking paused.')),
            );
          },
        ),
      );
    } else if (job.status == JobStatus.inShop) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.delivery_dining_rounded),
          label: const Text('Repair Completed ➔ Out for Delivery', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0891B2),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: () {
            jobService.outForDelivery(job.id);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Out for delivery initiated. Live delivery tracking link dispatched to customer.')),
            );
          },
        ),
      );
    } else if (job.status == JobStatus.outForDelivery) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.handshake_rounded),
          label: const Text('Delivered & Handover Confirmed', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: () {
            if (job.proofPhotos.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please attach at least 1 customer handover/proof photo before closing.'),
                  backgroundColor: Color(0xFFDC2626),
                  behavior: SnackBarBehavior.floating,
                ),
              );
              return;
            }
            jobService.completeJob(job.id);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Delivery confirmed! Job closed and digital receipt issued.')),
            );
          },
        ),
      );
    } else if (job.status == JobStatus.completed) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFD1FAE5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFA7F3D0)),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.verified_rounded, color: Color(0xFF059669), size: 28),
              SizedBox(height: 6),
              Text(
                'Job Completed & Verified',
                style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.bold, fontSize: 16),
              ),
              SizedBox(height: 2),
              Text(
                'Customer receipt & GST tax invoice have been finalized.',
                style: TextStyle(color: Color(0xFF047857), fontSize: 12),
              ),
            ],
          ),
        ),
      );
    } else if (job.status == JobStatus.cancelled) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Text(
            'Job Cancelled',
            style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
