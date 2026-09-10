import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Job } from '../../models/admin.models';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Financial & Service Compliance Reports</h1>
          <p>Statutory GST billing ledger, revenue audit, and technician completion metrics</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="printReport()">🖨️ Print GST Statement</button>
        </div>
      </header>

      <!-- Financial KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-title">Gross Invoiced (Total)</span>
          <span class="kpi-value" style="color: #34d399;">₹{{ calculateTotalRevenue(jobs$ | async) | number:'1.0-0' }}</span>
          <span class="kpi-sub">Total billed to customers</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">GST Collected (18%)</span>
          <span class="kpi-value" style="color: #38bdf8;">₹{{ calculateGst(jobs$ | async) | number:'1.0-0' }}</span>
          <span class="kpi-sub">CGST (9%) + SGST (9%)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Net Service Revenue</span>
          <span class="kpi-value" style="color: #fbbf24;">₹{{ calculateNetRevenue(jobs$ | async) | number:'1.0-0' }}</span>
          <span class="kpi-sub">Excluding statutory tax</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Completed Ratio</span>
          <span class="kpi-value" style="color: #c084fc;">{{ calculateCompletionRatio(jobs$ | async) }}</span>
          <span class="kpi-sub">Successful service delivery</span>
        </div>
      </div>

      <!-- Itemized Tax Invoice Audit Table -->
      <div class="content-card">
        <div class="card-header">
          <div>
            <h3>Tax Invoice Ledger (GSTIN: 32AABCU9603R1ZM)</h3>
            <p style="font-size: 11px; color: #94a3b8;">Image Mobiles & Computers Central Accounts Department</p>
          </div>
        </div>

        <div *ngIf="(jobs$ | async)?.length === 0" class="empty-card">
          <span class="empty-icon">📊</span>
          <h3>No Invoices Generated Yet</h3>
          <p>When service requests are created and billed, verified tax invoices with GSTIN compliance will appear here automatically.</p>
          <a routerLink="/jobs" class="btn btn-primary" style="margin-top: 12px; display: inline-block;">
            + Go to Dispatches
          </a>
        </div>

        <div class="table-responsive" *ngIf="((jobs$ | async)?.length || 0) > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer Name</th>
                <th>Service Type</th>
                <th>Date & Time</th>
                <th>Subtotal</th>
                <th>CGST (9%)</th>
                <th>SGST (9%)</th>
                <th>Total Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of jobs$ | async">
                <td><strong style="color: #38bdf8;">INV-{{ job.jobNumber }}</strong></td>
                <td>
                  <div style="font-weight: 700;">{{ job.customer.name }}</div>
                  <div style="font-size: 11px; color: #94a3b8;">{{ job.customer.phone }}</div>
                </td>
                <td style="font-size: 12px;">{{ job.serviceType }}</td>
                <td style="font-size: 12px; color: #94a3b8;">{{ job.createdAt }}</td>
                <td>₹{{ job.pricing.subtotal }}</td>
                <td>₹{{ ((job.pricing.subtotal * 0.09)) | number:'1.0-0' }}</td>
                <td>₹{{ ((job.pricing.subtotal * 0.09)) | number:'1.0-0' }}</td>
                <td><strong style="color: #34d399;">₹{{ job.pricing.total | number:'1.0-0' }}</strong></td>
                <td>
                  <span class="status-pill status-{{ job.status }}">
                    ● {{ formatStatus(job.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 20px; font-weight: 800; color: #fff; }
    .page-header p { font-size: 12px; color: #94a3b8; }
    .header-actions { display: flex; gap: 8px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .kpi-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 16px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
    .kpi-value { font-size: 22px; font-weight: 800; color: #fff; }
    .kpi-sub { font-size: 11px; color: #64748b; }

    .content-card { background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; }
    .card-header h3 { font-size: 14px; font-weight: 700; color: #fff; }

    .empty-card { padding: 48px 24px; text-align: center; color: #94a3b8; }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .empty-card h3 { font-size: 16px; color: #fff; font-weight: 700; }
    .empty-card p { font-size: 12px; margin-top: 4px; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    .data-table th { background: rgba(15, 23, 42, 0.6); padding: 12px 18px; color: #94a3b8; border-bottom: 1px solid #2a374f; }
    .data-table td { padding: 14px 18px; border-bottom: 1px solid #1e293b; }
  `]
})
export class ReportsPageComponent {
  private adminService = inject(AdminService);
  jobs$ = this.adminService.getJobs();

  calculateTotalRevenue(jobs: Job[] | null): number {
    if (!jobs) return 0;
    return jobs.reduce((sum, j) => sum + (j.pricing?.total || 0), 0);
  }

  calculateGst(jobs: Job[] | null): number {
    if (!jobs) return 0;
    return jobs.reduce((sum, j) => sum + ((j.pricing?.subtotal || 0) * 0.18), 0);
  }

  calculateNetRevenue(jobs: Job[] | null): number {
    if (!jobs) return 0;
    return jobs.reduce((sum, j) => sum + (j.pricing?.subtotal || 0), 0);
  }

  calculateCompletionRatio(jobs: Job[] | null): string {
    if (!jobs || jobs.length === 0) return '0%';
    const completed = jobs.filter(j => j.status === 'completed').length;
    return `${Math.round((completed / jobs.length) * 100)}%`;
  }

  formatStatus(s: string): string {
    return s ? s.replace('_', ' ') : '';
  }

  printReport(): void {
    window.print();
  }
}
