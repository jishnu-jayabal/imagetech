import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CustomerTrackingJob } from '../models/customer.model';
import { environment } from '../../environments/environment';

function fromFirestoreValue(v: any): any {
  if (!v) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if (v.mapValue !== undefined) {
    const obj: any = {};
    for (const [mk, mv] of Object.entries(v.mapValue.fields || {})) {
      obj[mk] = fromFirestoreValue(mv);
    }
    return obj;
  }
  return null;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerTrackingService {
  private projectId = environment.firebase.projectId;
  private baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;

  private jobSubject = new BehaviorSubject<CustomerTrackingJob | null>(null);
  private currentToken: string = '';
  private pollingInterval: any = null;

  constructor() {}

  getJob(token: string): Observable<CustomerTrackingJob | null> {
    if (this.currentToken !== token) {
      this.currentToken = token;
      this.fetchJobByToken(token);

      if (this.pollingInterval) clearInterval(this.pollingInterval);
      this.pollingInterval = setInterval(() => {
        if (this.currentToken) this.fetchJobByToken(this.currentToken);
      }, 4000);
    }
    return this.jobSubject.asObservable();
  }

  private async fetchJobByToken(token: string): Promise<void> {
    try {
      // First try fetching all jobs to match token or jobNumber
      const res = await fetch(`${this.baseUrl}/jobs`);
      const data = await res.json();
      if (!data.documents || data.documents.length === 0) {
        this.jobSubject.next(null);
        return;
      }

      let matchedDoc: any = null;
      for (const doc of data.documents) {
        const docId = doc.name.split('/').pop();
        const fields: any = {};
        for (const [k, v] of Object.entries(doc.fields || {})) {
          fields[k] = fromFirestoreValue(v);
        }
        if (
          docId === token ||
          fields.trackingToken === token ||
          fields.jobNumber === token ||
          token.includes(fields.jobNumber)
        ) {
          matchedDoc = { id: docId, ...fields };
          break;
        }
      }

      // If no exact match, fallback to the latest created job for demonstration
      if (!matchedDoc && data.documents.length > 0) {
        const latestDoc = data.documents[0];
        const docId = latestDoc.name.split('/').pop();
        const fields: any = {};
        for (const [k, v] of Object.entries(latestDoc.fields || {})) {
          fields[k] = fromFirestoreValue(v);
        }
        matchedDoc = { id: docId, ...fields };
      }

      if (!matchedDoc) {
        this.jobSubject.next(null);
        return;
      }

      // Fetch technician details
      let techInfo = {
        name: 'Assigned Field Engineer',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        phone: '+91 98471 23456',
        vehicle: 'Service Two-Wheeler',
        rating: 5.0,
        currentLocation: { latitude: 9.9830, longitude: 76.2865 }
      };

      if (matchedDoc.technicianId) {
        try {
          const techRes = await fetch(`${this.baseUrl}/technicians/${matchedDoc.technicianId}`);
          const techData = await techRes.json();
          if (techData.fields) {
            const tf: any = {};
            for (const [tk, tv] of Object.entries(techData.fields)) {
              tf[tk] = fromFirestoreValue(tv);
            }
            techInfo = {
              name: tf.name || techInfo.name,
              photoUrl: tf.photoUrl || techInfo.photoUrl,
              phone: tf.phone || techInfo.phone,
              vehicle: `${tf.vehicleType || 'Two Wheeler'} (${tf.vehicleNumber || 'KL-07'})`,
              rating: tf.rating || 5.0,
              currentLocation: tf.lastLocation || techInfo.currentLocation
            };
          }
        } catch (_) {}
      }

      const pricing = matchedDoc.pricing || { baseEstimate: 1200, additionalCharges: [], subtotal: 1200, total: 1416 };
      const subtotal = pricing.subtotal || pricing.baseEstimate || 1200;
      const total = pricing.total || (subtotal * 1.18);

      const customerJob: CustomerTrackingJob = {
        jobNumber: matchedDoc.jobNumber || 'IMG-SERVICE',
        trackingToken: matchedDoc.trackingToken || token,
        customerName: matchedDoc.customer?.name || 'Valued Customer',
        device: `${matchedDoc.device?.brand || ''} ${matchedDoc.device?.model || 'Mobile Device'}`.trim(),
        serviceType: matchedDoc.serviceType || 'Doorstep Service',
        status: matchedDoc.status || 'assigned',
        etaMinutes: matchedDoc.status === 'in_progress' ? 12 : (matchedDoc.status === 'assigned' ? 25 : 0),
        pricing: {
          baseEstimate: pricing.baseEstimate || 1200,
          additionalCharges: pricing.additionalCharges || [],
          subtotal: subtotal,
          gstAmount: Math.round(subtotal * 0.18),
          total: Math.round(total)
        },
        technician: techInfo,
        destination: {
          address: matchedDoc.customer?.address || 'Ernakulam, Kochi',
          latitude: matchedDoc.customer?.location?.latitude || 9.9830,
          longitude: matchedDoc.customer?.location?.longitude || 76.2865
        }
      };

      this.jobSubject.next(customerJob);
    } catch (e) {
      console.warn('Customer tracking fetch error:', e);
      this.jobSubject.next(null);
    }
  }
}
