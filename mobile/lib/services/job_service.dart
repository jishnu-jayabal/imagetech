import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/job_model.dart';
import '../models/technician_model.dart';
import 'firebase_service.dart';

class JobService extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();

  List<Job> _jobs = [];
  List<Technician> _availableTechnicians = [];
  Technician? _currentTechnician;
  StreamSubscription<List<Job>>? _jobsSubscription;
  StreamSubscription<User?>? _authSubscription;
  Timer? _gpsBroadcastTimer;
  int _currentRouteIndex = 0;
  bool _isGpsBroadcasting = false;
  bool _isInitialLoading = true;
  bool _isLoading = false;
  String? _authError;
  String? _currentVerificationId;
  int? _resendToken;

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
  bool get isInitialLoading => _isInitialLoading;
  bool get isLoading => _isLoading;
  String? get authError => _authError;
  String? get currentVerificationId => _currentVerificationId;
  bool get isLoggedIn => _currentTechnician != null;

  void resetOtp() {
    _currentVerificationId = null;
    _authError = null;
    _isLoading = false;
    notifyListeners();
  }

  JobService() {
    _initService();
  }

  @override
  void dispose() {
    _gpsBroadcastTimer?.cancel();
    _jobsSubscription?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initService() async {
    _isLoading = true;
    notifyListeners();

    // Fetch roster from Firestore for verification and quick-select
    await fetchAvailableTechnicians();

    // Listen to Firebase Auth state changes
    _authSubscription = _firebaseService.authStateChanges.listen((user) async {
      if (user != null && user.phoneNumber != null) {
        debugPrint('[JobService] Authenticated user detected: ${user.phoneNumber}');
        await _resolveTechnicianProfile(user.phoneNumber!);
      } else if (user == null && _currentTechnician != null) {
        _currentTechnician = null;
        _jobsSubscription?.cancel();
        _jobs = [];
        notifyListeners();
      }
      _isLoading = false;
      notifyListeners();
    });

    // Check if user is already signed in at startup
    if (_firebaseService.currentUser != null &&
        _firebaseService.currentUser!.phoneNumber != null) {
      await _resolveTechnicianProfile(_firebaseService.currentUser!.phoneNumber!);
    }

    _isInitialLoading = false;
    _isLoading = false;
    notifyListeners();
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

  Future<void> _resolveTechnicianProfile(String phoneNumber) async {
    _isLoading = true;
    notifyListeners();

    // 1. Try finding in Firestore by phone
    Technician? matchedTech = await _firebaseService.fetchTechnicianByPhone(phoneNumber);

    // 2. If not found in live query, check in cached available technicians
    if (matchedTech == null && _availableTechnicians.isNotEmpty) {
      final normalizedInput = phoneNumber.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
      try {
        matchedTech = _availableTechnicians.firstWhere((t) {
          final normalizedTech = t.phone.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');
          return normalizedTech == normalizedInput ||
              (normalizedInput.length >= 10 &&
                  normalizedTech.endsWith(normalizedInput.substring(normalizedInput.length - 10)));
        });
      } catch (_) {
        matchedTech = null;
      }
    }

    // 3. Reject if not registered as an authorized technician
    if (matchedTech == null) {
      debugPrint('[JobService] Access denied: $phoneNumber is not registered in technicians list.');
      await _firebaseService.signOut();
      _currentTechnician = null;
      _authError = 'Access Denied: Mobile number $phoneNumber is not registered as an authorized Image Mobiles technician. Please contact your Branch Manager.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    _currentTechnician = matchedTech;
    _subscribeToJobsStream(matchedTech.id);
    _isLoading = false;
    notifyListeners();
  }

  // --- FIREBASE PHONE AUTHENTICATION METHODS ---

  /// Request SMS OTP code for mobile number with roster check
  Future<bool> sendOtp(String phoneNumber) async {
    _isLoading = true;
    _authError = null;
    notifyListeners();

    // Strict validation: Mobile number must be in the Firestore technicians roster
    final tech = await _firebaseService.fetchTechnicianByPhone(phoneNumber);
    if (tech == null) {
      debugPrint('[JobService] sendOtp blocked: $phoneNumber is not in technicians roster.');
      _authError = 'Access Denied: Mobile number $phoneNumber is not registered as a technician in the company roster. Please contact your Branch Manager.';
      _isLoading = false;
      notifyListeners();
      return false;
    }

    final result = await _firebaseService.sendOtp(
      phoneNumber: phoneNumber,
      forceResendingToken: _resendToken,
      onCodeSent: (verificationId, resendToken) {
        _currentVerificationId = verificationId;
        _resendToken = resendToken;
        _isLoading = false;
        notifyListeners();
      },
      onAutoVerified: (credential) async {
        _isLoading = false;
        notifyListeners();
      },
      onError: (error) {
        _authError = error;
        _isLoading = false;
        notifyListeners();
      },
    );

    if (result['success'] == true) {
      if (result['verificationId'] != null) {
        _currentVerificationId = result['verificationId'];
      }
      if (result['resendToken'] != null) {
        _resendToken = result['resendToken'];
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      _authError = result['error'] as String? ?? 'Failed to send verification code';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Verify 6-digit SMS OTP code
  Future<bool> verifyOtp(String smsCode, String phoneNumber) async {
    if (_currentVerificationId == null && !kIsWeb) {
      _authError = 'Verification session expired. Please request a new code.';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _authError = null;
    notifyListeners();

    final result = await _firebaseService.verifyOtp(
      verificationId: _currentVerificationId ?? '',
      smsCode: smsCode,
    );

    if (result['success'] == true) {
      await _resolveTechnicianProfile(phoneNumber);
      if (_currentTechnician == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      _authError = result['error'] as String? ?? 'Invalid verification code';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Select a technician from the roster directly (for development & testing)
  Future<void> selectTechnician(Technician tech) async {
    _currentTechnician = tech;
    _subscribeToJobsStream(tech.id);
    notifyListeners();
  }

  /// Log out technician and clear session
  Future<void> signOut() async {
    _jobsSubscription?.cancel();
    _gpsBroadcastTimer?.cancel();
    _isGpsBroadcasting = false;
    _currentTechnician = null;
    _jobs = [];
    _currentVerificationId = null;
    _resendToken = null;
    await _firebaseService.signOut();
    notifyListeners();
  }

  // --- REAL-TIME FIRESTORE JOBS STREAM ---

  Future<void> syncJobsFromFirestore({bool silent = false}) async {
    if (_currentTechnician == null) return;
    try {
      final remoteJobs = await _firebaseService.fetchJobs(
        technicianId: _currentTechnician!.id,
      );
      _jobs = remoteJobs;
      if (!silent) notifyListeners();
    } catch (e) {
      debugPrint('[JobService] syncJobsFromFirestore error: $e');
    }
  }

  void _subscribeToJobsStream(String technicianId) {
    _jobsSubscription?.cancel();
    _jobsSubscription = _firebaseService.streamJobs(technicianId: technicianId).listen(
      (remoteJobs) {
        _jobs = remoteJobs;
        debugPrint('[JobService] Realtime Firestore sync: received ${_jobs.length} jobs for $technicianId');
        notifyListeners();
      },
      onError: (error) {
        debugPrint('[JobService] Realtime Firestore stream error: $error');
      },
    );
  }

  Job? getJobById(String id) {
    try {
      return _jobs.firstWhere((j) => j.id == id);
    } catch (_) {
      return null;
    }
  }

  // --- FIELD JOB LIFECYCLE STAGES (Written Directly to Firestore) ---

  // Stage 1: Technician taps "Start Trip" (Assigned -> In Progress)
  Future<void> startTrip(String jobId) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.status = JobStatus.inProgress;
    _isGpsBroadcasting = true;
    _currentRouteIndex = 0;
    notifyListeners();

    // Sync status to Firestore
    await _firebaseService.updateJobStatus(jobId, JobStatus.inProgress.statusString);

    // Start live GPS telemetry broadcast to Firestore
    _gpsBroadcastTimer?.cancel();
    _gpsBroadcastTimer = Timer.periodic(const Duration(seconds: 12), (timer) async {
      if (_currentRouteIndex < _routeWaypoints.length - 1) {
        _currentRouteIndex++;
        final wp = _routeWaypoints[_currentRouteIndex];
        debugPrint('[GPS Stream] Ping lat: ${wp['lat']}, lng: ${wp['lng']}');

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

  // Additional Charges with 18% GST (Written to Firestore)
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

  // Add Proof Photo for closure (Written to Firestore)
  Future<void> addProofPhoto(String jobId, String photoUrl) async {
    final job = getJobById(jobId);
    if (job == null) return;

    job.proofPhotos.add(photoUrl);
    notifyListeners();

    await _firebaseService.addJobProofPhoto(jobId, job.proofPhotos);
  }

  // Technician-Created Job (Written to Firestore collection 'jobs')
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

    return await _firebaseService.createJob(jobData);
  }
}
