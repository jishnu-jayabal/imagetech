class Technician {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String photoUrl;
  final String vehicleNumber;
  final String vehicleType;
  final String branchId;
  final String status;
  final List<String> skills;
  final double rating;
  final int completedJobsCount;
  final int batteryLevel;
  double latitude;
  double longitude;

  Technician({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.photoUrl,
    required this.vehicleNumber,
    required this.vehicleType,
    this.branchId = 'branch_mg_road',
    this.status = 'available',
    required this.skills,
    required this.rating,
    required this.completedJobsCount,
    required this.batteryLevel,
    required this.latitude,
    required this.longitude,
  });

  factory Technician.fromJson(Map<String, dynamic> json) {
    double lat = 9.9723;
    double lng = 76.2783;
    if (json['lastLocation'] is Map) {
      lat = (json['lastLocation']['latitude'] as num?)?.toDouble() ?? 9.9723;
      lng = (json['lastLocation']['longitude'] as num?)?.toDouble() ?? 76.2783;
    }

    return Technician(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Technician',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String? ?? '',
      photoUrl: json['photoUrl'] as String? ?? '',
      vehicleNumber: json['vehicleNumber'] as String? ?? '',
      vehicleType: json['vehicleType'] as String? ?? 'Bike',
      branchId: json['branchId'] as String? ?? 'branch_mg_road',
      status: json['status'] as String? ?? 'available',
      skills: List<String>.from(json['skills'] as List? ?? []),
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      completedJobsCount: (json['completedJobsCount'] as num?)?.toInt() ?? 0,
      batteryLevel: (json['batteryLevel'] as num?)?.toInt() ?? 100,
      latitude: lat,
      longitude: lng,
    );
  }
}
