import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Technician } from '../../models/admin.models';

@Component({
  selector: 'app-technicians-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Field Service Technicians</h1>
          <p>Technician roster, vehicle details, duty status controls, and real-time telemetry</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Add Technician
        </button>
      </header>

      <!-- Filter Chips -->
      <div class="filter-chips">
        <button class="chip" [class.active]="selectedStatus === 'ALL'" (click)="selectedStatus = 'ALL'">
          All Technicians
        </button>
        <button class="chip" [class.active]="selectedStatus === 'available'" (click)="selectedStatus = 'available'">
          🟢 Available
        </button>
        <button class="chip" [class.active]="selectedStatus === 'on_duty'" (click)="selectedStatus = 'on_duty'">
          🟡 On Duty
        </button>
        <button class="chip" [class.active]="selectedStatus === 'offline'" (click)="selectedStatus = 'offline'">
          ⚫ Offline
        </button>
      </div>

      <!-- Empty State -->
      <div class="empty-card" *ngIf="filteredTechnicians.length === 0">
        <span class="empty-icon">🛵</span>
        <h3>No Technicians Registered</h3>
        <p *ngIf="selectedStatus !== 'ALL'">No technicians currently match the "{{ selectedStatus }}" status filter.</p>
        <p *ngIf="selectedStatus === 'ALL'">You have not onboarded any field technicians yet. Add your first service technician below.</p>
        <button class="btn btn-primary" style="margin-top: 12px;" (click)="openAddModal()">
          + Add First Technician
        </button>
      </div>

      <!-- Technicians Grid -->
      <div class="tech-grid" *ngIf="filteredTechnicians.length > 0">
        <div class="tech-card" *ngFor="let tech of filteredTechnicians">
          <div class="card-top">
            <div class="avatar-box">
              <span class="avatar-placeholder">{{ getInitials(tech.name) }}</span>
              <span class="status-indicator" [class.on-duty]="tech.status === 'on_duty'" [class.available]="tech.status === 'available'" [class.offline]="tech.status === 'offline'"></span>
            </div>
            <div class="tech-meta">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3>{{ tech.name }}</h3>
                <div class="rating-badge">★ {{ tech.rating || 5.0 }}</div>
              </div>
              <p class="phone">📞 {{ tech.phone }}</p>
              <div class="vehicle-chip">
                <span>🛵</span>
                <span>{{ tech.vehicleType }} ({{ tech.vehicleNumber }})</span>
              </div>
            </div>
          </div>

          <div class="card-stats">
            <div class="stat-col">
              <span class="stat-label">Jobs Done</span>
              <span class="stat-val">{{ tech.completedJobsCount || 0 }}</span>
            </div>
            <div class="stat-col">
              <span class="stat-label">Branch Hub</span>
              <span class="stat-val" style="font-size: 11px; color: #38bdf8;">{{ getBranchName(tech.branchId) }}</span>
            </div>
            <div class="stat-col">
              <span class="stat-label">GPS Lat/Lng</span>
              <span class="stat-val" style="font-size: 10px;">
                {{ tech.lastLocation?.latitude | number:'1.2-2' }}, {{ tech.lastLocation?.longitude | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Duty Status Quick Toggle -->
          <div class="duty-controls">
            <span class="control-label">Set Status:</span>
            <div class="duty-btns">
              <button class="duty-btn" [class.selected]="tech.status === 'available'" (click)="updateStatus(tech, 'available')">
                Available
              </button>
              <button class="duty-btn" [class.selected]="tech.status === 'on_duty'" (click)="updateStatus(tech, 'on_duty')">
                On Duty
              </button>
              <button class="duty-btn" [class.selected]="tech.status === 'offline'" (click)="updateStatus(tech, 'offline')">
                Offline
              </button>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-sm btn-outline" (click)="openEditModal(tech)">Edit Info</button>
            <button class="btn btn-sm btn-outline" style="color: #ef4444;" (click)="deleteTech(tech)">🗑️ Remove</button>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD / EDIT TECHNICIAN -->
      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal-box">
          <div class="modal-header">
            <h4>{{ isEditing ? 'Edit Technician Profile' : 'Onboard Field Technician' }}</h4>
            <button class="btn btn-sm btn-outline" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-input" [(ngModel)]="currentTech.name" placeholder="e.g. Anand Kumar" />
            </div>
            <div>
              <label class="form-label">Mobile Phone Number *</label>
              <input type="text" class="form-input" [(ngModel)]="currentTech.phone" placeholder="e.g. +91 98470 12345" />
            </div>
            <div>
              <label class="form-label">Assigned Branch Hub</label>
              <select class="form-input" [(ngModel)]="currentTech.branchId">
                <option value="">Central Headquarters</option>
                <option *ngFor="let b of branches$ | async" [value]="b.id">{{ b.name }} ({{ b.code }})</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label class="form-label">Vehicle Type</label>
                <input type="text" class="form-input" [(ngModel)]="currentTech.vehicleType" placeholder="e.g. Honda Activa 6G" />
              </div>
              <div>
                <label class="form-label">Vehicle Reg. Number</label>
                <input type="text" class="form-input" [(ngModel)]="currentTech.vehicleNumber" placeholder="e.g. KL-07-CD-4512" />
              </div>
            </div>
            <div>
              <label class="form-label">Initial Duty Status</label>
              <select class="form-input" [(ngModel)]="currentTech.status">
                <option value="available">Available (Ready for assignment)</option>
                <option value="on_duty">On Duty (In transit / Active)</option>
                <option value="offline">Offline (Shift ended)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveTechnician()">
              {{ isEditing ? 'Save Changes' : 'Add Technician & Sync' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 20px; font-weight: 800; color: #fff; }
    .page-header p { font-size: 12px; color: #94a3b8; }

    .filter-chips { display: flex; gap: 8px; }
    .chip {
      background: #1e293b; border: 1px solid #2a374f; color: #94a3b8; padding: 6px 14px;
      border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .chip.active { background: #2563eb; color: #fff; border-color: #2563eb; }

    .empty-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 48px 24px;
      text-align: center; color: #94a3b8;
    }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .empty-card h3 { font-size: 16px; color: #fff; font-weight: 700; }
    .empty-card p { font-size: 12px; margin-top: 4px; }

    .tech-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .tech-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .card-top { display: flex; align-items: center; gap: 12px; }
    .avatar-box { position: relative; }
    .avatar-placeholder {
      width: 48px; height: 48px; border-radius: 50%; background: #2563eb; color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;
    }
    .status-indicator {
      width: 12px; height: 12px; border-radius: 50%;
      position: absolute; bottom: 0; right: 0; border: 2px solid #131b2e;
    }
    .status-indicator.available { background: #10b981; }
    .status-indicator.on-duty { background: #fbbf24; }
    .status-indicator.offline { background: #64748b; }

    .tech-meta { flex: 1; }
    .tech-meta h3 { font-size: 15px; font-weight: 700; color: #fff; }
    .tech-meta .phone { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .vehicle-chip { font-size: 11px; color: #38bdf8; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
    .rating-badge {
      background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 800;
      font-size: 11px; padding: 3px 8px; border-radius: 6px;
    }

    .card-stats {
      background: #0f172a; border-radius: 8px; padding: 10px 14px;
      display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; gap: 8px;
    }
    .stat-label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .stat-val { font-size: 12px; font-weight: 700; color: #fff; margin-top: 2px; }

    .duty-controls {
      display: flex; flex-direction: column; gap: 6px; background: rgba(15, 23, 42, 0.6);
      padding: 8px 12px; border-radius: 8px; border: 1px solid #1e293b;
    }
    .control-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .duty-btns { display: flex; gap: 6px; }
    .duty-btn {
      flex: 1; background: #1e293b; border: 1px solid #2a374f; color: #94a3b8;
      border-radius: 6px; padding: 5px; font-size: 11px; cursor: pointer; transition: all 0.15s;
    }
    .duty-btn.selected { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 700; }

    .card-actions { display: flex; gap: 8px; margin-top: 4px; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid #2a374f; display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class TechniciansPageComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);

  technicians$ = this.adminService.getTechnicians();
  branches$ = this.adminService.getBranches();

  selectedStatus = 'ALL';
  showModal = false;
  isEditing = false;
  currentTechId = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        setTimeout(() => this.openAddModal(), 150);
      }
    });
  }

  currentTech: any = {
    name: '',
    phone: '',
    vehicleType: 'Honda Activa 6G',
    vehicleNumber: 'KL-07-XX-1234',
    branchId: '',
    status: 'available'
  };

  get filteredTechnicians(): Technician[] {
    let techs: Technician[] = [];
    this.technicians$.subscribe(t => techs = t);
    if (this.selectedStatus === 'ALL') return techs;
    return techs.filter(t => t.status === this.selectedStatus);
  }

  getInitials(name: string): string {
    if (!name) return 'TC';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getBranchName(branchId: string): string {
    if (!branchId) return 'Main Central';
    let name = 'Hub';
    this.branches$.subscribe(branches => {
      const found = branches.find(b => b.id === branchId);
      if (found) name = found.name;
    });
    return name;
  }

  openAddModal(): void {
    let firstBranchId = '';
    this.branches$.subscribe(b => { if (b.length > 0) firstBranchId = b[0].id; });

    this.isEditing = false;
    this.currentTechId = '';
    this.currentTech = {
      name: '',
      phone: '',
      vehicleType: 'Honda Activa 6G',
      vehicleNumber: 'KL-07-XX-1234',
      branchId: firstBranchId,
      status: 'available'
    };
    this.showModal = true;
  }

  openEditModal(tech: Technician): void {
    this.isEditing = true;
    this.currentTechId = tech.id;
    this.currentTech = {
      name: tech.name,
      phone: tech.phone,
      vehicleType: tech.vehicleType,
      vehicleNumber: tech.vehicleNumber,
      branchId: tech.branchId,
      status: tech.status
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  async saveTechnician(): Promise<void> {
    if (!this.currentTech.name || !this.currentTech.phone) {
      alert('Technician full name and mobile phone are required.');
      return;
    }

    if (this.isEditing && this.currentTechId) {
      await this.adminService.updateTechnician(this.currentTechId, this.currentTech);
    } else {
      await this.adminService.createTechnician(this.currentTech);
    }

    this.showModal = false;
  }

  async updateStatus(tech: Technician, status: 'available' | 'on_duty' | 'offline'): Promise<void> {
    await this.adminService.updateTechnicianStatus(tech.id, status);
  }

  async deleteTech(tech: Technician): Promise<void> {
    if (confirm(`Remove technician "${tech.name}" from active roster?`)) {
      await this.adminService.deleteTechnician(tech.id);
    }
  }
}
