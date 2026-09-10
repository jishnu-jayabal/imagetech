import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/job_model.dart';
import '../models/technician_model.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  String? get userId => _auth.currentUser?.uid;
  bool get isAuthenticated => _auth.currentUser != null;

  // --- AUTHENTICATION ---

  Future<Map<String, dynamic>> signInWithEmailPassword(
      String email, String password) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      return {'success': true, 'user': userCredential.user};
    } on FirebaseAuthException catch (e) {
      return {'success': false, 'error': e.message ?? 'Authentication failed'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  // --- TECHNICIANS API ---

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

  // --- JOBS API ---

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
