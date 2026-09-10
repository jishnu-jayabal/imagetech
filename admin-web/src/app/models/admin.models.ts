export type JobStatus = 
  | 'pending_estimate' 
  | 'assigned' 
  | 'in_progress' 
  | 'rescheduled_shop' 
  | 'in_shop' 
  | 'out_for_delivery' 
  | 'completed' 
  | 'cancelled';

export interface AdditionalCharge {
  id: string;
  title: string;
  amount: number;
  addedAt: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  trackingToken: string;
  branchId: string;
  technicianId: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    location: { latitude: number; longitude: number; };
  };
  device: {
    brand: string;
    model: string;
    color: string;
    imeiOrSerial?: string;
  };
  serviceType: string;
  issueDescription: string;
  status: JobStatus;
  pricing: {
    baseEstimate: number;
    estimateApproved: boolean;
    additionalCharges: AdditionalCharge[];
    subtotal: number;
    gstRate: number;
    total: number;
  };
  createdAt: string;
}

export interface Technician {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  email?: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  completedJobsCount: number;
  status: 'on_duty' | 'available' | 'offline';
  lastLocation: { latitude: number; longitude: number; };
}

export type AdminRole = 'super_admin' | 'branch_manager';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  branchId?: string;
  branchName?: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  managerName?: string;
  managerEmail?: string;
  managerUid?: string;
  location?: { latitude: number; longitude: number; };
  activeTechniciansCount: number;
}
