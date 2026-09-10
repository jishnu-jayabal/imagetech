import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/job_model.dart';
import '../models/technician_model.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  ConfirmationResult? _webConfirmationResult;

  User? get currentUser => _auth.currentUser;
  String? get userId => _auth.currentUser?.uid;
  String? get currentPhoneNumber => _auth.currentUser?.phoneNumber;
  bool get isAuthenticated => _auth.currentUser != null;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // --- PHONE AUTHENTICATION ---

  /// Sends OTP to the technician's mobile number.
  /// Works across Android, iOS, and Web.
  Future<Map<String, dynamic>> sendOtp({
    required String phoneNumber,
    int? forceResendingToken,
    void Function(String verificationId, int? resendToken)? onCodeSent,
    void Function(PhoneAuthCredential credential)? onAutoVerified,
    void Function(String error)? onError,
  }) async {
    final cleanPhone = phoneNumber.trim();

    if (kIsWeb) {
      try {
        _webConfirmationResult = await _auth.signInWithPhoneNumber(cleanPhone);
        return {
          'success': true,
          'verificationId': 'web_${_webConfirmationResult.hashCode}',
          'isWeb': true,
        };
      } catch (e) {
        debugPrint('[FirebaseService] Web phone auth error: $e');
        return {
          'success': false,
          'error': e.toString(),
        };
      }
    }

    final completer = Completer<Map<String, dynamic>>();

    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: cleanPhone,
        forceResendingToken: forceResendingToken,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          debugPrint('[FirebaseService] Phone verification completed automatically.');
          try {
            await _auth.signInWithCredential(credential);
            if (onAutoVerified != null) onAutoVerified(credential);
            if (!completer.isCompleted) {
              completer.complete({'success': true, 'autoVerified': true});
            }
          } catch (e) {
            debugPrint('[FirebaseService] Auto sign-in error: $e');
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          debugPrint('[FirebaseService] Phone verification failed: ${e.code} - ${e.message}');
          final errMsg = e.message ?? 'Phone verification failed (${e.code})';
          if (onError != null) onError(errMsg);
          if (!completer.isCompleted) {
            completer.complete({'success': false, 'error': errMsg});
          }
        },
        codeSent: (String verificationId, int? resendToken) {
          debugPrint('[FirebaseService] OTP code sent. Verification ID: $verificationId');
          if (onCodeSent != null) onCodeSent(verificationId, resendToken);
          if (!completer.isCompleted) {
            completer.complete({
              'success': true,
              'verificationId': verificationId,
              'resendToken': resendToken,
            });
          }
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          debugPrint('[FirebaseService] Code auto-retrieval timed out for: $verificationId');
        },
      );
    } catch (e) {
      debugPrint('[FirebaseService] verifyPhoneNumber threw exception: $e');
      return {'success': false, 'error': e.toString()};
    }

    return completer.future;
  }

  /// Verifies the 6-digit SMS OTP code entered by the technician
  Future<Map<String, dynamic>> verifyOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      UserCredential userCredential;
      if (kIsWeb && _webConfirmationResult != null) {
        userCredential = await _webConfirmationResult!.confirm(smsCode.trim());
      } else {
        final credential = PhoneAuthProvider.credential(
          verificationId: verificationId,
          smsCode: smsCode.trim(),
        );
        userCredential = await _auth.signInWithCredential(credential);
      }

      return {
        'success': true,
        'user': userCredential.user,
      };
    } on FirebaseAuthException catch (e) {
      debugPrint('[FirebaseService] verifyOtp FirebaseAuthException: ${e.code} - ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Invalid verification code',
      };
    } catch (e) {
      debugPrint('[FirebaseService] verifyOtp unexpected error: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  Future<void> signOut() async {
    _webConfirmationResult = null;
    await _auth.signOut();
  }

  // --- TECHNICIANS FIRESTORE API ---

  /// Finds technician matching the verified phone number (with digit normalization)
  Future<Technician?> fetchTechnicianByPhone(String phone) async {
    try {
      final snapshot = await _firestore.collection('technicians').get();
      final normalizedInput = phone.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');

      for (final doc in snapshot.docs) {
        final data = doc.data();
        data['id'] = doc.id;
        final tech = Technician.fromJson(data);
        final normalizedTechPhone = tech.phone.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');

        if (normalizedTechPhone == normalizedInput ||
            (normalizedInput.length >= 10 &&
                normalizedTechPhone.endsWith(
                    normalizedInput.substring(normalizedInput.length - 10)))) {
          return tech;
        }
      }
      return null;
    } catch (e) {
      debugPrint('[FirebaseService] fetchTechnicianByPhone error: $e');
      return null;
    }
  }

  Future<List<Technician>> fetchTechnicians() async {
    try {
      final snapshot = await _firestore.collection('technicians').get();
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Technician.fromJson(data);
      }).toList();
    } catch (e) {
      debugPrint('[FirebaseService] fetchTechnicians error: $e');
      return [];
    }
  }

  Future<void> updateTechnicianLocation(
      String techId, double lat, double lng, int battery) async {
    try {
      await _firestore.collection('technicians').doc(techId).update({
        'lastLocation': {
          'latitude': lat,
          'longitude': lng,
          'timestamp': DateTime.now().toIso8601String(),
        },
        'batteryLevel': battery,
      });
    } catch (e) {
      debugPrint('[FirebaseService] updateLocation error: $e');
    }
  }

  // --- JOBS FIRESTORE API ---

  Future<List<Job>> fetchJobs({String? technicianId}) async {
    try {
      Query query = _firestore.collection('jobs');
      if (technicianId != null && technicianId.isNotEmpty) {
        query = query.where('technicianId', isEqualTo: technicianId);
      }
      final snapshot = await query.get();
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        data['id'] = doc.id;
        return Job.fromJson(data);
      }).toList();
    } catch (e) {
      debugPrint('[FirebaseService] fetchJobs error: $e');
      return [];
    }
  }

  Stream<List<Job>> streamJobs({String? technicianId}) {
    Query query = _firestore.collection('jobs');
    if (technicianId != null && technicianId.isNotEmpty) {
      query = query.where('technicianId', isEqualTo: technicianId);
    }
    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        data['id'] = doc.id;
        return Job.fromJson(data);
      }).toList();
    });
  }

  Future<bool> updateJobStatus(String jobId, String newStatus) async {
    try {
      await _firestore.collection('jobs').doc(jobId).update({
        'status': newStatus,
        'updatedAt': DateTime.now().toIso8601String(),
      });
      return true;
    } catch (e) {
      debugPrint('[FirebaseService] updateJobStatus error: $e');
      return false;
    }
  }

  Future<bool> addJobAdditionalCharge(
      String jobId,
      List<AdditionalCharge> allCharges,
      double subtotal,
      double grandTotal) async {
    try {
      final chargeMaps = allCharges
          .map((c) => {
                'id': c.id,
                'title': c.title,
                'amount': c.amount,
                'addedAt': c.addedAt.toIso8601String(),
              })
          .toList();

      await _firestore.collection('jobs').doc(jobId).update({
        'pricing.additionalCharges': chargeMaps,
        'pricing.subtotal': subtotal,
        'pricing.total': grandTotal,
        'updatedAt': DateTime.now().toIso8601String(),
      });
      return true;
    } catch (e) {
      debugPrint('[FirebaseService] addJobAdditionalCharge error: $e');
      return false;
    }
  }

  Future<bool> addJobProofPhoto(String jobId, List<String> allPhotos) async {
    try {
      await _firestore.collection('jobs').doc(jobId).update({
        'completionProof.photoUrls': allPhotos,
        'completionProof.completedAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      });
      return true;
    } catch (e) {
      debugPrint('[FirebaseService] addJobProofPhoto error: $e');
      return false;
    }
  }

  Future<bool> createJob(Map<String, dynamic> jobData) async {
    try {
      await _firestore.collection('jobs').add(jobData);
      return true;
    } catch (e) {
      debugPrint('[FirebaseService] createJob error: $e');
      return false;
    }
  }
}
