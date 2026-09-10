import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/job_model.dart';
import '../models/technician_model.dart';
import 'firebase_service.dart';

class JobService extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();

  List<Job> _jobs = [];
  List<Technician> _availableTechnicians = [];
  Technician? _currentTechnician;
  Timer? _gpsBroadcastTimer;
  Timer? _pollingTimer;
  int _currentRouteIndex = 0;
  bool _isGpsBroadcasting = false;
  bool _isLoading = false;
  String? _authError;

  // Real Kochi Route Waypoints (M.G. Road -> Palarivattom)
  final List<Map<String, double>> _routeWaypoints = [
    {'lat': 9.9723, 'lng': 76.2783},
    {'lat': 9.9775, 'lng': 76.2825},
    {'lat': 9.9838, 'lng': 76.2872},
    {'lat': 9.9892, 'lng': 76.2930},
    {'lat': 9.9965, 'lng': 76.2995},
    {'lat': 10.0018, 'lng': 76.3040},
    {'lat': 10.0055, 'lng': 76.3075},
  ];

  List<Job> get jobs => _jobs;
  List<Technician> get availableTechnicians => _availableTechnicians;
  Technician? get currentTechnician => _currentTechnician;
  bool get isGpsBroadcasting => _isGpsBroadcasting;
  bool get isLoading => _isLoading;
  String? get authError => _authError;
  bool get isLoggedIn => _currentTechnician != null;

  JobService() {
    _initService();
  }

  @override
  void dispose() {
    _gpsBroadcastTimer?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _initService() async {
    await fetchAvailableTechnicians();
    // Default fallback technician for immediate development readiness
    if (_currentTechnician == null && _availableTechnicians.isNotEmpty) {
      _currentTechnician = _availableTechnicians.first;
      await syncJobsFromFirestore();
    } else if (_currentTechnician == null) {
      _currentTechnician = Technician(
        id: 'tech_rahul',
        name: 'Rahul Kumar',
        phone: '+91 98471 23456',
        email: 'rahul.k@imagemobiles.in',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        vehicleNumber: 'KL-07-CD-4912',
        vehicleType: 'Honda Activa 6G',
        skills: ['Apple Screen Specialist', 'OnePlus Certified'],
        rating: 4.92,
        completedJobsCount: 348,
        batteryLevel: 89,
        latitude: 9.9723,
        longitude: 76.2783,
      );
      await syncJobsFromFirestore();
    }

    // Start periodic background Firestore sync (every 4 seconds)
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_currentTechnician != null) {
        syncJobsFromFirestore(silent: true);
      }
    });
  }

  Future<void> fetchAvailableTechnicians() async {
    try {
      final techs = await _firebaseService.fetchTechnicians();
      if (techs.isNotEmpty) {
        _availableTechnicians = techs;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[JobService] fetchAvailableTechnicians error: $e');
    }
  }

  Future<bool> signInWithEmailPassword(String email, String password) async {
    _isLoading = true;
    _authError = null;
    notifyListeners();

    final result = await _firebaseService.signInWithEmailPassword(email, password);
    _isLoading = false;

    if (result['success'] == true) {
      // Find matching technician by email in available technicians
      await fetchAvailableTechnicians();
      final matching = _availableTechnicians.firstWhere(
        (t) => t.email.toLowerCase() == email.trim().toLowerCase(),
        orElse: () => _availableTechnicians.isNotEmpty
            ? _availableTechnicians.first
            : Technician(
                id: 'tech_${DateTime.now().millisecondsSinceEpoch}',
                name: email.split('@').first.toUpperCase(),
                phone: '+91 98470 12345',
                email: email,
                photoUrl: '',
                vehicleNumber: 'KL-07-CD-0001',
                vehicleType: 'Field Service Bike',
                skills: ['Doorstep Technician'],
                rating: 5.0,
                completedJobsCount: 0,
                batteryLevel: 95,
                latitude: 9.9816,
                longitude: 76.2999,
              ),
      );

      _currentTechnician = matching;
      await syncJobsFromFirestore();
      notifyListeners();
      return true;
    } else {
      _authError = result['error'] as String? ?? 'Login failed';
      notifyListeners();
      return false;
    }
  }

  void selectTechnician(Technician tech) {
    _currentTechnician = tech;
    syncJobsFromFirestore();
    notifyListeners();
  }

  void signOut() {
    _firebaseService.signOut();
    _currentTechnician = null;
    _jobs = [];
    _gpsBroadcastTimer?.cancel();
    _isGpsBroadcasting = false;
    notifyListeners();
  }

  Future<void> syncJobsFromFirestore({bool silent = false}) async {
    if (_currentTechnician == null) return;
    try {
      final remoteJobs = await _firebaseService.fetchJobs(
        technicianId: _currentTechnician!.id,
      );

      if (remoteJobs.isNotEmpty) {
        _jobs = remoteJobs;
      } else if (_jobs.isEmpty) {
        // Provide initial ready job so technician has an active dispatch to interact with
        _loadFallbackJob();
      }

      if (!silent) notifyListeners();
    } catch (e) {
      debugPrint('[JobService] syncJobsFromFirestore error: $e');
      if (_jobs.isEmpty) {
        _loadFallbackJob();
      }
    }
  }

  void _loadFallbackJob() {
    _jobs = [
      Job(
        id: 'job_7204',
        jobNumber: 'IMG-7204',
        trackingToken: 'IMG-7204-KL',
        branchId: 'branch_mg_road',
        technicianId: _currentTechnician?.id ?? 'tech_rahul',
        customer: CustomerInfo(
          name: 'Dr. Priya Nair',
          phone: '+91 94470 98123',
          address: 'Flat 4B, Skyline Oasis, Palarivattom, Kochi',
          latitude: 10.0055,
          longitude: 76.3075,
        ),
        device: DeviceInfo(
          brand: 'OnePlus',
          model: 'OnePlus 11 5G',
          color: 'Emerald Green',
        ),
        issueDescription: 'Green vertical lines on AMOLED screen, fast battery drainage',
        serviceType: 'Doorstep Inspection & Screen Repair',
        status: JobStatus.assigned,
        baseEstimate: 1200.0,
        additionalCharges: [],
        proofPhotos: [],
        scheduledAt: DateTime.now().add(const Duration(minutes: 30)),
      ),
    ];
    notifyListeners();
  }

  Job? getJobById(String id) {
    try {
      return _jobs.firstWhere((j) => j.id == id);
    } catch (_) {
      return null;
    }
  }

  // --- JOB LIFECYCLE STAGES (From PDF Section 3.5 & 5) ---

  // Stage 1: Technician taps "Start Trip" (Assigned -> In Progress)
  Future<void> startTrip(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.status = JobStatus.inProgress;
    _isGpsBroadcasting = true;
    _currentRouteIndex = 0;
    notifyListeners();

    // Sync to Firestore
    await _firebaseService.updateJobStatus(jobId, JobStatus.inProgress.statusString);

    // Start 10-15s live GPS broadcast (PDF Section 4)
    _gpsBroadcastTimer?.cancel();
    _gpsBroadcastTimer = Timer.periodic(const Duration(seconds: 12), (timer) async {
      if (_currentRouteIndex < _routeWaypoints.length - 1) {
        _currentRouteIndex++;
        final wp = _routeWaypoints[_currentRouteIndex];
        debugPrint('[GPS Stream] Ping: lat: ${wp['lat']}, lng: ${wp['lng']}');

        if (_currentTechnician != null) {
          _currentTechnician!.latitude = wp['lat']!;
          _currentTechnician!.longitude = wp['lng']!;
          await _firebaseService.updateTechnicianLocation(
            _currentTechnician!.id,
            wp['lat']!,
            wp['lng']!,
            _currentTechnician!.batteryLevel,
          );
        }
      } else {
        _gpsBroadcastTimer?.cancel();
        _isGpsBroadcasting = false;
        notifyListeners();
      }
    });
  }

  // Stage 2: Shop-Repair Workflow Leg 1 (In Progress -> Rescheduled to Shop)
  Future<void> rescheduleToShop(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.status = JobStatus.rescheduledShop;
    _isGpsBroadcasting = true;
    notifyListeners();

    await _firebaseService.updateJobStatus(jobId, JobStatus.rescheduledShop.statusString);
  }

  // Stage 3: Device arrives at shop bench (Rescheduled Shop -> In Shop)
  Future<void> markInShop(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.status = JobStatus.inShop;
    _isGpsBroadcasting = false;
    _gpsBroadcastTimer?.cancel();
    notifyListeners();

    await _firebaseService.updateJobStatus(jobId, JobStatus.inShop.statusString);
  }

  // Stage 4: Shop-Repair Workflow Leg 2 (In Shop -> Out for Delivery)
  Future<void> outForDelivery(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.status = JobStatus.outForDelivery;
    _isGpsBroadcasting = true;
    _currentRouteIndex = 0;
    notifyListeners();

    await _firebaseService.updateJobStatus(jobId, JobStatus.outForDelivery.statusString);
  }

  // Stage 5: Delivered & Confirmed -> Completed
  Future<bool> completeJob(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return false;

    // Per company requirement (PDF Section 4): Proof photos required to close
    if (job.proofPhotos.isEmpty) {
      return false;
    }

    job.status = JobStatus.completed;
    _isGpsBroadcasting = false;
    _gpsBroadcastTimer?.cancel();
    notifyListeners();

    await _firebaseService.updateJobStatus(jobId, JobStatus.completed.statusString);
    return true;
  }

  // Additional Charges with 18% GST (PDF Section 3.3)
  Future<void> addAdditionalCharge(String jobId, String title, double amount) async {
    final job = getJobById(jobId);
    if (job == null) return;

    final newCharge = AdditionalCharge(
      id: 'ch_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      amount: amount,
      addedAt: DateTime.now(),
    );

    job.additionalCharges.add(newCharge);
    notifyListeners();

    await _firebaseService.addJobAdditionalCharge(
      jobId,
      job.additionalCharges,
      job.subtotal,
      job.grandTotal,
    );
  }

  // Add Proof Photo for closure
  Future<void> addProofPhoto(String jobId, String photoUrl) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.proofPhotos.add(photoUrl);
    notifyListeners();

    await _firebaseService.addJobProofPhoto(jobId, job.proofPhotos);
  }

  // Technician-Created Job (PDF Section 3.3: sits in "Pending Estimate")
  Future<bool> createOnsiteIntakeJob({
    required String customerName,
    required String customerPhone,
    required String customerAddress,
    required String deviceModel,
    required String issueDescription,
    required double baseEstimate,
  }) async {
    final newJobNum = 'IMG-${1000 + DateTime.now().millisecond}';
    final token = '$newJobNum-KL';

    final jobData = {
      'jobNumber': newJobNum,
      'trackingToken': token,
      'branchId': _currentTechnician?.branchId ?? 'branch_mg_road',
      'technicianId': _currentTechnician?.id ?? 'tech_rahul',
      'customer': {
        'name': customerName,
        'phone': customerPhone,
        'address': customerAddress,
        'location': {'latitude': 9.9816, 'longitude': 76.2999},
      },
      'device': {
        'brand': deviceModel.split(' ').first,
        'model': deviceModel,
        'color': 'Standard',
      },
      'serviceType': 'Onsite Field Intake',
      'issueDescription': issueDescription,
      'status': JobStatus.pendingEstimate.statusString,
      'pricing': {
        'baseEstimate': baseEstimate,
        'estimateApproved': false,
        'additionalCharges': [],
        'subtotal': baseEstimate,
        'gstRate': 0.18,
        'total': baseEstimate * 1.18,
      },
      'completionProof': {'photoUrls': []},
      'createdAt': DateTime.now().toIso8601String(),
    };

    final success = await _firebaseService.createJob(jobData);
    if (success) {
      await syncJobsFromFirestore();
    }
    return success;
  }
}
