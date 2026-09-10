import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Branch } from '../../models/admin.models';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Branches & Regional Repair Hubs</h1>
          <p>Regional service centers, central testing laboratories, and parts storage hubs</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Add New Branch
        </button>
      </header>

      <!-- Empty State -->
      <div class="empty-card" *ngIf="(branches$ | async)?.length === 0">
        <span class="empty-icon">🏢</span>
        <h3>No Service Hubs Configured</h3>
        <p>Branches represent physical service centers in Kochi/Kerala where technicians are assigned and complex repairs are handled.</p>
        <button class="btn btn-primary" style="margin-top: 12px;" (click)="openAddModal()">
          + Create First Branch
        </button>
      </div>

      <!-- Branches Grid -->
      <div class="branch-grid" *ngIf="((branches$ | async)?.length || 0) > 0">
        <div class="branch-card" *ngFor="let branch of branches$ | async">
          <div>
            <div class="card-header">
              <div>
                <span class="code-badge">{{ branch.code }}</span>
                <h3>{{ branch.name }}</h3>
              </div>
              <span class="icon">🏢</span>
            </div>

            <div class="card-body">
              <p class="address">📍 {{ branch.address }}</p>
              <p class="phone" *ngIf="branch.phone">📞 {{ branch.phone }}</p>
              <div class="manager-chip" style="margin-bottom: 12px; font-size: 11px; display: flex; align-items: center; gap: 6px; background: #0f172a; padding: 6px 10px; border-radius: 6px; border: 1px solid #1e293b;">
                <span>👤</span>
                <span *ngIf="branch.managerName">Branch Manager: <strong style="color: #38bdf8;">{{ branch.managerName }}</strong></span>
                <span *ngIf="!branch.managerName" style="color: #64748b;">No Branch Manager Assigned</span>
              </div>
              <div class="stat-box">
                <span class="stat-number">{{ countTechniciansForBranch(branch.id) }}</span>
                <span class="stat-label">Rostered Technicians</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-sm btn-outline" (click)="openEditModal(branch)">Edit Hub</button>
            <button class="btn btn-sm btn-outline" style="color: #ef4444;" (click)="deleteBranch(branch)">🗑️ Delete</button>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD / EDIT BRANCH -->
      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal-box">
          <div class="modal-header">
            <h4>{{ isEditing ? 'Edit Service Branch' : 'Add New Service Branch' }}</h4>
            <button class="btn btn-sm btn-outline" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label class="form-label">Branch Hub Name *</label>
              <input type="text" class="form-input" [(ngModel)]="currentBranch.name" placeholder="e.g. Kakkanad Tech Hub" />
            </div>
            <div>
              <label class="form-label">Branch Identifier Code *</label>
              <input type="text" class="form-input" [(ngModel)]="currentBranch.code" placeholder="e.g. IMG-KKD" />
            </div>
            <div>
              <label class="form-label">Contact Phone Number</label>
              <input type="text" class="form-input" [(ngModel)]="currentBranch.phone" placeholder="e.g. 0484-2391200 / +91 94470 11223" />
            </div>
            <div>
              <label class="form-label">Full Address & Landmark *</label>
              <textarea class="form-input" rows="2" [(ngModel)]="currentBranch.address" placeholder="e.g. Near Infopark Express Way, Kakkanad, Kochi 682030"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveBranch()">
              {{ isEditing ? 'Save Changes' : 'Create Branch & Sync' }}
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

    .empty-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 48px 24px;
      text-align: center; color: #94a3b8;
    }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .empty-card h3 { font-size: 16px; color: #fff; font-weight: 700; }
    .empty-card p { font-size: 12px; margin-top: 4px; max-width: 480px; margin-left: auto; margin-right: auto; }

    .branch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .branch-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; justify-content: space-between; gap: 16px;
    }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .code-badge {
      display: inline-block; background: rgba(37, 99, 235, 0.2); color: #38bdf8;
      font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;
    }
    .card-header h3 { font-size: 16px; font-weight: 700; color: #fff; }
    .card-header .icon { font-size: 24px; }

    .address { font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 6px; }
    .phone { font-size: 11px; color: #cbd5e1; margin-bottom: 12px; }
    .stat-box {
      background: #0f172a; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 10px;
    }
    .stat-number { font-size: 20px; font-weight: 800; color: #34d399; }
    .stat-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }

    .card-footer { display: flex; gap: 8px; border-top: 1px solid #1e293b; padding-top: 14px; }
    .card-footer button { flex: 1; }

    .modal-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid #2a374f; display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class BranchesPageComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);

  branches$ = this.adminService.getBranches();
  technicians$ = this.adminService.getTechnicians();

  showModal = false;
  isEditing = false;
  currentBranchId = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        setTimeout(() => this.openAddModal(), 150);
      }
    });
  }

  currentBranch = {
    name: '',
    code: '',
    phone: '',
    address: ''
  };

  countTechniciansForBranch(branchId: string): number {
    let count = 0;
    this.technicians$.subscribe(techs => {
      count = techs.filter(t => t.branchId === branchId).length;
    });
    return count;
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentBranchId = '';
    this.currentBranch = {
      name: '',
      code: '',
      phone: '',
      address: ''
    };
    this.showModal = true;
  }

  openEditModal(branch: Branch): void {
    this.isEditing = true;
    this.currentBranchId = branch.id;
    this.currentBranch = {
      name: branch.name,
      code: branch.code,
      phone: branch.phone || '',
      address: branch.address
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  async saveBranch(): Promise<void> {
    if (!this.currentBranch.name || !this.currentBranch.code) {
      alert('Branch Name and Code are required');
      return;
    }

    if (this.isEditing && this.currentBranchId) {
      await this.adminService.updateBranch(this.currentBranchId, this.currentBranch);
    } else {
      await this.adminService.createBranch({
        name: this.currentBranch.name,
        code: this.currentBranch.code,
        phone: this.currentBranch.phone,
        address: this.currentBranch.address || 'Kochi, Kerala',
        activeTechniciansCount: 0
      });
    }

    this.showModal = false;
  }

  async deleteBranch(branch: Branch): Promise<void> {
    if (confirm(`Are you sure you want to remove branch "${branch.name}"?`)) {
      await this.adminService.deleteBranch(branch.id);
    }
  }
}
