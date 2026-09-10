import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Job, Technician, Branch, JobStatus, AdditionalCharge } from '../models/admin.models';
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

function fromFirestoreDoc<T>(doc: any): T {
  const result: any = { id: doc.name ? doc.name.split('/').pop() : '' };
  if (doc.fields) {
    for (const [k, v] of Object.entries(doc.fields)) {
      result[k] = fromFirestoreValue(v);
    }
  }
  return result as T;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private projectId = environment.firebase.projectId;
  private baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;

  private branchesSubject = new BehaviorSubject<Branch[]>([]);
  private techniciansSubject = new BehaviorSubject<Technician[]>([]);
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  isLoading$ = this.loadingSubject.asObservable();

  constructor() {
    this.refreshAll();
    // Real-time polling interval (every 4 seconds)
    setInterval(() => this.refreshAll(), 4000);
  }

  async refreshAll(): Promise<void> {
    await Promise.all([
      this.fetchBranches(),
      this.fetchTechnicians(),
      this.fetchJobs()
    ]);
  }

  // --- FETCH QUERIES ---
  private async fetchBranches() {
    try {
      const res = await fetch(`${this.baseUrl}/branches`);
      const data = await res.json();
      if (data.documents) {
        const branches = data.documents.map((d: any) => fromFirestoreDoc<Branch>(d));
        this.branchesSubject.next(branches);
      } else {
        this.branchesSubject.next([]);
      }
    } catch (e) {
      console.warn('Branches fetch error:', e);
    }
  }

  private async fetchTechnicians() {
    try {
      const res = await fetch(`${this.baseUrl}/technicians`);
      const data = await res.json();
      if (data.documents) {
        const techs = data.documents.map((d: any) => fromFirestoreDoc<Technician>(d));
        this.techniciansSubject.next(techs);
      } else {
        this.techniciansSubject.next([]);
      }
    } catch (e) {
      console.warn('Technicians fetch error:', e);
    }
  }

  private async fetchJobs() {
    try {
      const res = await fetch(`${this.baseUrl}/jobs`);
      const data = await res.json();
      if (data.documents) {
        const jobs = data.documents.map((d: any) => fromFirestoreDoc<Job>(d));
        this.jobsSubject.next(jobs);
      } else {
        this.jobsSubject.next([]);
      }
    } catch (e) {
      console.warn('Jobs fetch error:', e);
    }
  }

  getJobs(): Observable<Job[]> {
    return this.jobsSubject.asObservable();
  }

  getTechnicians(): Observable<Technician[]> {
    return this.techniciansSubject.asObservable();
  }

  getBranches(): Observable<Branch[]> {
    return this.branchesSubject.asObservable();
  }

  // --- FULL CRUD: JOBS ---
  async createJob(jobData: Partial<Job>): Promise<string> {
    const randomId = `job_${Date.now().toString().slice(-5)}`;
    const jobNumber = `IMG-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingToken = `${jobNumber}-KL`;
    const subtotal = jobData.pricing?.baseEstimate || 1200;
    const gst = subtotal * 0.18;

    const fullJob: any = {
      jobNumber,
      trackingToken,
      branchId: jobData.branchId || '',
      technicianId: jobData.technicianId || '',
      customer: jobData.customer || {
        name: 'Customer',
        phone: '',
        address: '',
        location: { latitude: 9.9830, longitude: 76.2865 }
      },
      device: jobData.device || { brand: '', model: '', color: '' },
      serviceType: jobData.serviceType || 'Doorstep Diagnostic & Repair',
      issueDescription: jobData.issueDescription || '',
      status: jobData.status || (jobData.pricing?.estimateApproved ? 'assigned' : 'pending_estimate'),
      pricing: {
        baseEstimate: subtotal,
        estimateApproved: !!jobData.pricing?.estimateApproved,
        additionalCharges: [],
        subtotal: subtotal,
        gstRate: 0.18,
        total: subtotal + gst
      },
      createdAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const current = this.jobsSubject.value;
    this.jobsSubject.next([{ id: randomId, ...fullJob }, ...current]);

    try {
      const fields: any = {};
      for (const [k, v] of Object.entries(fullJob)) {
        fields[k] = toFirestoreValue(v);
      }

      await fetch(`${this.baseUrl}/jobs/${randomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      await this.refreshAll();
      return randomId;
    } catch (err) {
      console.error('Failed to create job in Firestore:', err);
      throw err;
    }
  }

  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      const url = `${this.baseUrl}/jobs/${jobId}?updateMask.fieldPaths=status`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: status } } })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async reassignTechnician(jobId: string, technicianId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/jobs/${jobId}?updateMask.fieldPaths=technicianId&updateMask.fieldPaths=status`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            technicianId: { stringValue: technicianId },
            status: { stringValue: 'assigned' }
          }
        })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to reassign technician:', err);
    }
  }

  async approveEstimate(jobId: string, newAmount: number): Promise<void> {
    const gst = newAmount * 0.18;
    const total = newAmount + gst;

    try {
      const url = `${this.baseUrl}/jobs/${jobId}?updateMask.fieldPaths=pricing.baseEstimate&updateMask.fieldPaths=pricing.estimateApproved&updateMask.fieldPaths=pricing.subtotal&updateMask.fieldPaths=pricing.total&updateMask.fieldPaths=status`;
      const payload = {
        fields: {
          status: { stringValue: 'assigned' },
          pricing: {
            mapValue: {
              fields: {
                baseEstimate: { doubleValue: newAmount },
                estimateApproved: { booleanValue: true },
                subtotal: { doubleValue: newAmount },
                gstRate: { doubleValue: 0.18 },
                total: { doubleValue: total },
                additionalCharges: { arrayValue: { values: [] } }
              }
            }
          }
        }
      };

      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to approve estimate:', err);
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/jobs/${jobId}`, { method: 'DELETE' });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  }

  // --- FULL CRUD: TECHNICIANS ---
  async createTechnician(tech: Partial<Technician>): Promise<string> {
    const techId = `tech_${Date.now().toString().slice(-5)}`;
    const newTech: any = {
      name: tech.name || '',
      phone: tech.phone || '',
      email: tech.email ? tech.email.trim() : '',
      branchId: tech.branchId || '',
      vehicleNumber: tech.vehicleNumber || '',
      vehicleType: tech.vehicleType || '',
      rating: 5.0,
      completedJobsCount: 0,
      status: 'available',
      lastLocation: { latitude: 9.9830, longitude: 76.2865 }
    };

    try {
      const fields: any = {};
      for (const [k, v] of Object.entries(newTech)) {
        fields[k] = toFirestoreValue(v);
      }
      await fetch(`${this.baseUrl}/technicians/${techId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      await this.refreshAll();
      return techId;
    } catch (err) {
      console.error('Failed to create technician:', err);
      throw err;
    }
  }

  async updateTechnician(techId: string, updates: Partial<Technician>): Promise<void> {
    try {
      const current = this.techniciansSubject.value.find(t => t.id === techId);
      if (!current) return;
      const updated = { ...current, ...updates };
      const fields: any = {};
      for (const [k, v] of Object.entries(updated)) {
        if (k !== 'id') fields[k] = toFirestoreValue(v);
      }
      await fetch(`${this.baseUrl}/technicians/${techId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to update technician:', err);
    }
  }

  async updateTechnicianStatus(techId: string, status: 'on_duty' | 'available' | 'offline'): Promise<void> {
    try {
      const url = `${this.baseUrl}/technicians/${techId}?updateMask.fieldPaths=status`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: status } } })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to update tech status:', err);
    }
  }

  async deleteTechnician(techId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/technicians/${techId}`, { method: 'DELETE' });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to delete technician:', err);
    }
  }

  // --- FULL CRUD: BRANCHES ---
  async createBranch(branch: Partial<Branch>): Promise<string> {
    const branchId = `branch_${Date.now().toString().slice(-5)}`;
    const newBranch: any = {
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      activeTechniciansCount: 0
    };

    try {
      const fields: any = {};
      for (const [k, v] of Object.entries(newBranch)) {
        fields[k] = toFirestoreValue(v);
      }
      await fetch(`${this.baseUrl}/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      await this.refreshAll();
      return branchId;
    } catch (err) {
      console.error('Failed to create branch:', err);
      throw err;
    }
  }

  async updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
    try {
      const current = this.branchesSubject.value.find(b => b.id === branchId);
      if (!current) return;
      const updated = { ...current, ...updates };
      const fields: any = {};
      for (const [k, v] of Object.entries(updated)) {
        if (k !== 'id') fields[k] = toFirestoreValue(v);
      }
      await fetch(`${this.baseUrl}/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to update branch:', err);
    }
  }

  async deleteBranch(branchId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/branches/${branchId}`, { method: 'DELETE' });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to delete branch:', err);
    }
  }

  // --- FINANCIAL & JOB EXTRA CHARGES ---
  async addJobCharge(jobId: string, charge: { title: string; amount: number }): Promise<void> {
    const job = this.jobsSubject.value.find(j => j.id === jobId);
    if (!job) return;

    const newCharge: AdditionalCharge = {
      id: `ch_${Date.now().toString().slice(-4)}`,
      title: charge.title,
      amount: charge.amount,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedCharges = [...(job.pricing.additionalCharges || []), newCharge];
    const chargesSum = updatedCharges.reduce((sum, c) => sum + c.amount, 0);
    const subtotal = (job.pricing.baseEstimate || 0) + chargesSum;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    const newPricing = {
      baseEstimate: job.pricing.baseEstimate,
      estimateApproved: true,
      additionalCharges: updatedCharges,
      subtotal,
      gstRate: 0.18,
      total
    };

    try {
      const url = `${this.baseUrl}/jobs/${jobId}?updateMask.fieldPaths=pricing`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            pricing: toFirestoreValue(newPricing)
          }
        })
      });
      await this.refreshAll();
    } catch (err) {
      console.error('Failed to add job charge:', err);
    }
  }
}
