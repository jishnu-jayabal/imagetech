import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Operations Fleet Dashboard</h1>
          <p>Real-time telemetry and technician dispatch overview</p>
        </div>
        <div class="header-actions">
          <a routerLink="/jobs" [queryParams]="{ action: 'create' }" class="btn btn-primary">+ Create Dispatch</a>
        </div>
      </header>

      <!-- Welcome Setup Banner if Database is Empty -->
      <div class="setup-banner" *ngIf="(branches$ | async)?.length === 0 || (technicians$ | async)?.length === 0">
        <div class="setup-icon">🚀</div>
        <div class="setup-content">
          <h3>Welcome to Image Mobiles Field Service!</h3>
          <p>Your database is ready and clean. Complete these 3 steps to begin live operations:</p>
          <div class="setup-steps">
            <a routerLink="/branches" [queryParams]="{ action: 'create' }" class="step-btn">
              <span>1. Add a Branch</span>
              <span class="step-arrow">→</span>
            </a>
            <a routerLink="/technicians" [queryParams]="{ action: 'create' }" class="step-btn">
              <span>2. Add Technicians</span>
              <span class="step-arrow">→</span>
            </a>
            <a routerLink="/jobs" [queryParams]="{ action: 'create' }" class="step-btn">
              <span>3. Create Dispatches</span>
              <span class="step-arrow">→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-title">Active Technicians</span>
          <span class="kpi-value">{{ (technicians$ | async)?.length || 0 }} Active</span>
          <span class="kpi-sub">Field personnel on roster</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Total Dispatches</span>
          <span class="kpi-value">{{ (jobs$ | async)?.length || 0 }} Jobs</span>
          <span class="kpi-sub">Across all statuses</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Service Branches</span>
          <span class="kpi-value">{{ (branches$ | async)?.length || 0 }} Hubs</span>
          <span class="kpi-sub">Configured service centers</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Gross Revenue</span>
          <span class="kpi-value" style="color: #34d399;">₹{{ calculateRevenue(jobs$ | async) | number:'1.0-0' }}</span>
          <span class="kpi-sub">Total billed incl. GST</span>
        </div>
      </div>

      <!-- Live GPS Fleet Map -->
      <div class="content-card">
        <div class="card-header">
          <div>
            <h3>Live GPS Fleet Map</h3>
            <p>Live technician markers and service branches in Kochi region</p>
          </div>
          <span class="live-pill"><span class="dot"></span> Live GPS Tracking</span>
        </div>
        <div id="fleetMap" class="map-container"></div>
      </div>

      <!-- Recent Jobs Section -->
      <div class="content-card">
        <div class="card-header">
          <h3>Recent Dispatches</h3>
          <a routerLink="/jobs" style="font-size: 12px; color: #38bdf8; text-decoration: none;">View All Dispatches →</a>
        </div>

        <div *ngIf="(jobs$ | async)?.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <h4>No Service Dispatches Yet</h4>
          <p>Create your first customer repair request to track dispatching and technician progress.</p>
          <a routerLink="/jobs" [queryParams]="{ action: 'create' }" class="btn btn-primary" style="margin-top: 10px;">+ Create First Dispatch</a>
        </div>

        <div class="table-responsive" *ngIf="((jobs$ | async)?.length || 0) > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Job #</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Status</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of (jobs$ | async)?.slice(0, 5)">
                <td><strong style="color: #38bdf8;">{{ job.jobNumber }}</strong></td>
                <td>{{ job.customer.name }}</td>
                <td>{{ job.device.brand }} {{ job.device.model }}</td>
                <td><span class="status-pill status-{{ job.status }}">● {{ formatStatus(job.status) }}</span></td>
                <td><strong>₹{{ job.pricing.subtotal }}</strong></td>
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

    .setup-banner {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(56, 189, 248, 0.08));
      border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px;
      display: flex; align-items: center; gap: 18px;
    }
    .setup-icon { font-size: 36px; }
    .setup-content h3 { font-size: 16px; font-weight: 800; color: #fff; }
    .setup-content p { font-size: 12px; color: #94a3b8; margin: 4px 0 12px; }
    .setup-steps { display: flex; gap: 10px; flex-wrap: wrap; }
    .step-btn {
      background: #1e293b; border: 1px solid #2a374f; color: #f8fafc; padding: 8px 14px;
      border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;
      display: flex; align-items: center; gap: 8px; transition: all 0.15s;
    }
    .step-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
    .step-arrow { color: #38bdf8; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .kpi-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 16px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
    .kpi-value { font-size: 22px; font-weight: 800; color: #38bdf8; }
    .kpi-sub { font-size: 11px; color: #64748b; }

    .content-card { background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { font-size: 14px; font-weight: 700; color: #fff; }
    .card-header p { font-size: 11px; color: #94a3b8; }
    
    .live-pill { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #34d399; }
    .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }

    .map-container { height: 320px; width: 100%; }

    .empty-state { padding: 40px 20px; text-align: center; color: #94a3b8; }
    .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
    .empty-state h4 { font-size: 15px; color: #fff; font-weight: 700; }
    .empty-state p { font-size: 12px; margin-top: 4px; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    .data-table th { background: rgba(15, 23, 42, 0.6); padding: 12px 18px; color: #94a3b8; border-bottom: 1px solid #2a374f; }
    .data-table td { padding: 14px 18px; border-bottom: 1px solid #1e293b; }
  `]
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  jobs$ = this.adminService.getJobs();
  technicians$ = this.adminService.getTechnicians();
  branches$ = this.adminService.getBranches();

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;

  ngOnInit(): void {
    setTimeout(() => this.initMap(), 150);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  initMap(): void {
    const el = document.getElementById('fleetMap');
    if (!el) return;

    this.map = L.map('fleetMap', { zoomControl: false, attributionControl: false }).setView([9.9950, 76.2950], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Subscribe to live technicians & branches and update map markers dynamically!
    this.technicians$.subscribe(techs => {
      if (!this.markersLayer) return;
      this.markersLayer.clearLayers();

      techs.forEach(t => {
        if (t.lastLocation) {
          const m = L.marker([t.lastLocation.latitude, t.lastLocation.longitude]);
          m.bindPopup(`<b>${t.name}</b><br>${t.vehicleType} (${t.vehicleNumber})<br>Status: ${t.status}`);
          this.markersLayer!.addLayer(m);
        }
      });
    });

    this.branches$.subscribe(branches => {
      if (!this.markersLayer) return;
      branches.forEach(b => {
        // default coordinates if not provided
        const lat = 9.9723;
        const lng = 76.2783;
        const m = L.marker([lat, lng]);
        m.bindPopup(`<b>${b.name}</b><br>${b.address}`);
        this.markersLayer!.addLayer(m);
      });
    });
  }

  calculateRevenue(jobs: any[] | null): number {
    if (!jobs) return 0;
    return jobs.reduce((sum, j) => sum + (j.pricing?.total || 0), 0);
  }

  formatStatus(s: string): string {
    return s ? s.replace('_', ' ') : '';
  }
}
