import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-branch-managers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Branch Managers (Regional Admins)</h1>
          <p>Per Proposal Section 3.1: Super Admin assigns one Branch Manager per branch to manage local technicians and jobs</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Onboard Branch Manager
        </button>
      </header>

      <!-- Search & Filter Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search manager by name, email, or assigned branch..." [(ngModel)]="searchQuery" />
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-card" *ngIf="filteredManagers.length === 0">
        <span class="empty-icon">👥</span>
        <h3>No Branch Managers Found</h3>
        <p *ngIf="searchQuery">No branch managers match your search "{{ searchQuery }}".</p>
        <p *ngIf="!searchQuery">You have not onboarded any Branch Managers yet. Provision managers to oversee regional repair hubs.</p>
        <button class="btn btn-primary" style="margin-top: 12px;" (click)="openAddModal()">
          + Onboard First Branch Manager
        </button>
      </div>

      <!-- Managers Grid -->
      <div class="managers-grid" *ngIf="filteredManagers.length > 0">
        <div class="manager-card" *ngFor="let mgr of filteredManagers">
          <div class="card-top">
            <div class="avatar-box">
              <span class="avatar-placeholder">{{ getInitials(mgr.displayName || mgr.email) }}</span>
              <span class="status-indicator"></span>
            </div>
            <div class="mgr-meta">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3>{{ mgr.displayName || 'Branch Manager' }}</h3>
                <span class="role-badge">Branch Admin</span>
              </div>
              <p class="email">✉️ {{ mgr.email }}</p>
              <div class="branch-chip">
                <span>🏢</span>
                <span>{{ mgr.branchName || 'Assigned Branch Hub' }}</span>
              </div>
            </div>
          </div>

          <div class="card-stats">
            <div class="stat-col">
              <span class="stat-label">Authority</span>
              <span class="stat-val" style="color: #38bdf8;">Own Branch</span>
            </div>
            <div class="stat-col">
              <span class="stat-label">Added Date</span>
              <span class="stat-val">{{ mgr.createdAt || 'Active' }}</span>
            </div>
            <div class="stat-col">
              <span class="stat-label">Status</span>
              <span class="stat-val" style="color: #34d399;">Active</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-sm btn-outline" style="color: #ef4444;" (click)="deleteManager(mgr)">
              🗑️ Revoke Access
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: ONBOARD BRANCH MANAGER -->
      <div class="modal-overlay" *ngIf="showAddModal">
        <div class="modal-box">
          <div class="modal-header">
            <h4>Onboard Regional Branch Manager</h4>
            <button class="btn btn-sm btn-outline" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <p style="font-size: 12px; color: #94a3b8;">
              Branch Managers log in using their credentials to oversee their assigned branch, dispatch local technicians, and approve diagnostic estimates.
            </p>

            <div class="alert-box error" *ngIf="errorMessage">
              <span>⚠️</span>
              <p>{{ errorMessage }}</p>
            </div>

            <div>
              <label class="form-label">Manager Full Name *</label>
              <input type="text" class="form-input" [(ngModel)]="newManager.name" placeholder="e.g. Suresh Menon" />
            </div>

            <div>
              <label class="form-label">Official Work Email *</label>
              <input type="email" class="form-input" [(ngModel)]="newManager.email" placeholder="e.g. suresh&#64;imagemobiles.com" />
            </div>

            <div>
              <label class="form-label">Temporary Password * (Min 6 characters)</label>
              <input type="text" class="form-input" [(ngModel)]="newManager.password" placeholder="e.g. KochiManager2026!" />
            </div>

            <div>
              <label class="form-label">Assign to Branch Hub * (PDF 3.1 Spec)</label>
              <select class="form-input" [(ngModel)]="newManager.branchId">
                <option value="" disabled>-- Select Regional Branch --</option>
                <option *ngFor="let b of branches$ | async" [value]="b.id">
                  {{ b.name }} ({{ b.code }})
                </option>
              </select>
              <div *ngIf="(branches$ | async)?.length === 0" style="margin-top: 6px; font-size: 11px; color: #fbbf24;">
                ⚠️ No branches exist yet. <a routerLink="/branches" (click)="closeModal()" style="color: #38bdf8; text-decoration: underline;">Create a branch first</a>.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitCreateManager()" [disabled]="isSubmitting || (branches$ | async)?.length === 0">
              <span *ngIf="!isSubmitting">Provision Manager & Sync</span>
              <span *ngIf="isSubmitting">Creating in Firebase...</span>
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

    .filter-bar { display: flex; gap: 12px; }
    .search-box {
      display: flex; align-items: center; gap: 10px; background: #0f172a; border: 1px solid #2a374f;
      border-radius: 10px; padding: 0 14px; height: 44px; width: 100%; max-width: 440px;
      transition: all 0.2s ease;
    }
    .search-box:focus-within {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
      background: #111c33;
    }
    .search-box input {
      background: transparent; border: none; outline: none; color: #f8fafc; font-size: 13.5px; width: 100%; font-family: inherit;
    }

    .empty-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 48px 24px;
      text-align: center; color: #94a3b8;
    }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .empty-card h3 { font-size: 16px; color: #fff; font-weight: 700; }
    .empty-card p { font-size: 12px; margin-top: 4px; }

    .managers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .manager-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .card-top { display: flex; align-items: center; gap: 14px; }
    .avatar-box { position: relative; }
    .avatar-placeholder {
      width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669);
      color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;
    }
    .status-indicator {
      width: 12px; height: 12px; border-radius: 50%; background: #10b981;
      position: absolute; bottom: 0; right: 0; border: 2px solid #131b2e;
    }

    .mgr-meta { flex: 1; }
    .mgr-meta h3 { font-size: 15px; font-weight: 700; color: #fff; }
    .mgr-meta .email { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .branch-chip {
      font-size: 11px; color: #38bdf8; display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;
    }
    .role-badge {
      background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 700;
      font-size: 10px; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .card-stats {
      background: #0f172a; border-radius: 8px; padding: 10px 14px;
      display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; gap: 8px;
    }
    .stat-label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .stat-val { font-size: 12px; font-weight: 700; color: #fff; margin-top: 2px; }

    .card-actions { display: flex; gap: 8px; border-top: 1px solid #1e293b; padding-top: 12px; }
    .card-actions button { flex: 1; }

    .modal-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid #2a374f; display: flex; justify-content: flex-end; gap: 8px; }

    .alert-box {
      padding: 10px 14px; border-radius: 8px; font-size: 12px; display: flex;
      align-items: center; gap: 8px; line-height: 1.4;
    }
    .alert-box.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; }
  `]
})
export class BranchManagersPageComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  branches$ = this.adminService.getBranches();
  managers: any[] = [];
  searchQuery = '';

  showAddModal = false;
  isSubmitting = false;
  errorMessage = '';

  newManager = {
    name: '',
    email: '',
    password: '',
    branchId: ''
  };

  ngOnInit(): void {
    this.loadManagers();
  }

  get filteredManagers(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.managers;
    return this.managers.filter(m =>
      (m.displayName && m.displayName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.branchName && m.branchName.toLowerCase().includes(q))
    );
  }

  getInitials(name: string): string {
    if (!name) return 'BM';
    return name.slice(0, 2).toUpperCase();
  }

  async loadManagers(): Promise<void> {
    this.managers = await this.authService.getBranchManagers();
  }

  openAddModal(): void {
    let firstBranchId = '';
    this.branches$.subscribe(b => {
      if (b.length > 0) firstBranchId = b[0].id;
    });

    this.newManager = {
      name: '',
      email: '',
      password: '',
      branchId: firstBranchId
    };
    this.errorMessage = '';
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
  }

  async submitCreateManager(): Promise<void> {
    this.errorMessage = '';

    if (!this.newManager.name || !this.newManager.email || !this.newManager.password || !this.newManager.branchId) {
      this.errorMessage = 'Please complete all required fields including branch assignment.';
      return;
    }

    if (this.newManager.password.length < 6) {
      this.errorMessage = 'Temporary password must be at least 6 characters.';
      return;
    }

    this.isSubmitting = true;

    let branchName = 'Branch Hub';
    this.branches$.subscribe(branches => {
      const found = branches.find(b => b.id === this.newManager.branchId);
      if (found) branchName = found.name;
    });

    try {
      await this.authService.createBranchManager(
        this.newManager.email,
        this.newManager.password,
        this.newManager.name,
        this.newManager.branchId,
        branchName
      );
      this.showAddModal = false;
      await this.loadManagers();
      await this.adminService.refreshAll();
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to provision branch manager.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteManager(mgr: any): Promise<void> {
    if (confirm(`Revoke branch manager access for "${mgr.displayName || mgr.email}"?`)) {
      try {
        await fetch(`https://firestore.googleapis.com/v1/projects/imagemobiles-45aeb/databases/(default)/documents/admins/${mgr.id}`, {
          method: 'DELETE'
        });
        await this.loadManagers();
      } catch (e) {
        console.error('Delete manager error:', e);
      }
    }
  }
}
