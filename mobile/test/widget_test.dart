import 'package:flutter_test/flutter_test.dart';
import 'package:technician_app/models/job_model.dart';
import 'package:technician_app/models/technician_model.dart';

void main() {
  group('Model Unit Tests', () {
    test('Technician model JSON parsing and location extraction', () {
      final techJson = {
        'id': 'tech_rahul',
        'branchId': 'branch_mg_road',
        'name': 'Rahul Kumar',
        'phone': '+91 98471 23456',
        'email': 'rahul.k@imagemobiles.in',
        'vehicleNumber': 'KL-07-CD-4912',
        'vehicleType': 'Honda Activa 6G',
        'skills': ['OnePlus Certified', 'Apple Screen Specialist'],
        'rating': 4.92,
        'completedJobsCount': 348,
        'batteryLevel': 89,
        'lastLocation': {
          'latitude': 9.9723,
          'longitude': 76.2783,
        }
      };

      final tech = Technician.fromJson(techJson);
      expect(tech.id, 'tech_rahul');
      expect(tech.name, 'Rahul Kumar');
      expect(tech.phone, '+91 98471 23456');
      expect(tech.latitude, 9.9723);
      expect(tech.longitude, 76.2783);
      expect(tech.batteryLevel, 89);
    });

    test('Job model JSON parsing and GST calculation', () {
      final jobJson = {
        'id': 'job_7204',
        'jobNumber': 'IMG-7204',
        'trackingToken': 'IMG-7204-KL',
        'branchId': 'branch_mg_road',
        'technicianId': 'tech_rahul',
        'status': 'assigned',
        'customer': {
          'name': 'Dr. Priya Nair',
          'phone': '+91 94470 98123',
          'address': 'Kochi',
          'location': {'latitude': 10.0055, 'longitude': 76.3075},
        },
        'device': {
          'brand': 'OnePlus',
          'model': 'OnePlus 11 5G',
          'color': 'Emerald Green',
        },
        'pricing': {
          'baseEstimate': 1200.0,
          'additionalCharges': [
            {
              'id': 'ch_1',
              'title': 'UV Tempered Glass',
              'amount': 350.0,
              'addedAt': '2026-09-10T10:00:00Z',
            }
          ],
        },
        'completionProof': {'photoUrls': []},
        'scheduledAt': '2026-09-10T10:30:00Z',
      };

      final job = Job.fromJson(jobJson);
      expect(job.id, 'job_7204');
      expect(job.jobNumber, 'IMG-7204');
      expect(job.status, JobStatus.assigned);
      expect(job.baseEstimate, 1200.0);
      expect(job.additionalCharges.length, 1);
      expect(job.subtotal, 1550.0);
      expect(job.gstAmount, 1550.0 * 0.18);
      expect(job.grandTotal, 1550.0 * 1.18);
    });
  });
}
