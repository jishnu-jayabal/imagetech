export interface CustomerCharge {
  title: string;
  amount: number;
  addedAt: string;
}

export interface CustomerTrackingJob {
  jobNumber: string;
  trackingToken: string;
  customerName: string;
  device: string;
  serviceType: string;
  status: 'assigned' | 'in_progress' | 'rescheduled_shop' | 'in_shop' | 'out_for_delivery' | 'completed';
  etaMinutes: number;
  pricing: {
    baseEstimate: number;
    additionalCharges: CustomerCharge[];
    subtotal: number;
    gstAmount: number;
    total: number;
  };
  technician: {
    name: string;
    photoUrl: string;
    phone: string;
    vehicle: string;
    rating: number;
    currentLocation: {
      latitude: number;
      longitude: number;
    };
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
}
