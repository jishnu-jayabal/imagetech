import 'package:intl/intl.dart';

enum JobStatus {
  pendingEstimate,
  assigned,
  inProgress,
  rescheduledShop,
  inShop,
  outForDelivery,
  completed,
  cancelled;

  String get displayName {
    switch (this) {
      case JobStatus.pendingEstimate:
        return 'Pending Estimate';
      case JobStatus.assigned:
        return 'Assigned';
      case JobStatus.inProgress:
        return 'In Progress';
      case JobStatus.rescheduledShop:
        return 'Transit to Shop';
      case JobStatus.inShop:
        return 'In Lab Repair';
      case JobStatus.outForDelivery:
        return 'Out for Delivery';
      case JobStatus.completed:
        return 'Completed';
      case JobStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get statusString {
    switch (this) {
      case JobStatus.pendingEstimate:
        return 'pending_estimate';
      case JobStatus.assigned:
        return 'assigned';
      case JobStatus.inProgress:
        return 'in_progress';
      case JobStatus.rescheduledShop:
        return 'rescheduled_shop';
      case JobStatus.inShop:
        return 'in_shop';
      case JobStatus.outForDelivery:
        return 'out_for_delivery';
      case JobStatus.completed:
        return 'completed';
      case JobStatus.cancelled:
        return 'cancelled';
    }
  }

  static JobStatus fromString(String status) {
    switch (status) {
      case 'pending_estimate':
        return JobStatus.pendingEstimate;
      case 'assigned':
        return JobStatus.assigned;
      case 'in_progress':
        return JobStatus.inProgress;
      case 'rescheduled_shop':
        return JobStatus.rescheduledShop;
      case 'in_shop':
        return JobStatus.inShop;
      case 'out_for_delivery':
        return JobStatus.outForDelivery;
      case 'completed':
        return JobStatus.completed;
      case 'cancelled':
        return JobStatus.cancelled;
      default:
        return JobStatus.assigned;
    }
  }
}

class AdditionalCharge {
  final String id;
  final String title;
  final double amount;
  final DateTime addedAt;

  AdditionalCharge({
    required this.id,
    required this.title,
    required this.amount,
    required this.addedAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'addedAt': addedAt.toIso8601String(),
      };

  factory AdditionalCharge.fromJson(Map<String, dynamic> json) =>
      AdditionalCharge(
        id: json['id'] as String,
        title: json['title'] as String,
        amount: (json['amount'] as num).toDouble(),
        addedAt: DateTime.parse(json['addedAt'] as String),
      );
}

class CustomerInfo {
  final String name;
  final String phone;
  final String address;
  final double latitude;
  final double longitude;

  CustomerInfo({
    required this.name,
    required this.phone,
    required this.address,
    required this.latitude,
    required this.longitude,
  });

  factory CustomerInfo.fromJson(Map<String, dynamic> json) {
    double lat = 9.9816;
    double lng = 76.2999;
    if (json['location'] is Map) {
      lat = (json['location']['latitude'] as num?)?.toDouble() ?? 9.9816;
      lng = (json['location']['longitude'] as num?)?.toDouble() ?? 76.2999;
    }
    return CustomerInfo(
      name: json['name'] as String? ?? 'Customer',
      phone: json['phone'] as String? ?? '',
      address: json['address'] as String? ?? 'Kochi',
      latitude: lat,
      longitude: lng,
    );
  }
}

class DeviceInfo {
  final String brand;
  final String model;
  final String color;
  final String? imeiOrSerial;

  DeviceInfo({
    required this.brand,
    required this.model,
    required this.color,
    this.imeiOrSerial,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> json) => DeviceInfo(
        brand: json['brand'] as String? ?? 'Mobile',
        model: json['model'] as String? ?? 'Smartphone',
        color: json['color'] as String? ?? 'Standard',
        imeiOrSerial: json['imeiOrSerial'] as String?,
      );
}

class Job {
  final String id;
  final String jobNumber;
  final String trackingToken;
  final String branchId;
  final String technicianId;
  final CustomerInfo customer;
  final DeviceInfo device;
  final String issueDescription;
  final String serviceType;
  JobStatus status;
  double baseEstimate;
  List<AdditionalCharge> additionalCharges;
  List<String> proofPhotos;
  DateTime scheduledAt;

  Job({
    required this.id,
    required this.jobNumber,
    required this.trackingToken,
    required this.branchId,
    required this.technicianId,
    required this.customer,
    required this.device,
    required this.issueDescription,
    required this.serviceType,
    required this.status,
    required this.baseEstimate,
    required this.additionalCharges,
    required this.proofPhotos,
    required this.scheduledAt,
  });

  double get subtotal =>
      baseEstimate +
      additionalCharges.fold(0.0, (sum, charge) => sum + charge.amount);

  double get gstAmount => subtotal * 0.18;

  double get grandTotal => subtotal + gstAmount;

  String get formattedTotal =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0)
          .format(subtotal);

  factory Job.fromJson(Map<String, dynamic> json) {
    final pricing = json['pricing'] as Map<String, dynamic>? ?? {};
    final completionProof = json['completionProof'] as Map<String, dynamic>? ?? {};
    final additionalChargesList = (pricing['additionalCharges'] as List? ?? [])
        .map((e) => AdditionalCharge.fromJson(e as Map<String, dynamic>))
        .toList();

    return Job(
      id: json['id'] as String? ?? '',
      jobNumber: json['jobNumber'] as String? ?? 'IMG-JOB',
      trackingToken: json['trackingToken'] as String? ?? '',
      branchId: json['branchId'] as String? ?? '',
      technicianId: json['technicianId'] as String? ?? '',
      customer: CustomerInfo.fromJson(json['customer'] as Map<String, dynamic>? ?? {}),
      device: DeviceInfo.fromJson(json['device'] as Map<String, dynamic>? ?? {}),
      issueDescription: json['issueDescription'] as String? ?? '',
      serviceType: json['serviceType'] as String? ?? 'Doorstep Service',
      status: JobStatus.fromString(json['status'] as String? ?? 'assigned'),
      baseEstimate: (pricing['baseEstimate'] as num?)?.toDouble() ?? 0.0,
      additionalCharges: additionalChargesList,
      proofPhotos: List<String>.from(completionProof['photoUrls'] as List? ?? []),
      scheduledAt: DateTime.tryParse(json['scheduledAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
