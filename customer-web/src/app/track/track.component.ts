import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CustomerTrackingService } from '../services/customer-tracking.service';
import { CustomerTrackingJob } from '../models/customer.model';
import * as L from 'leaflet';

@Component({
  selector: 'customer-track',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mobile-container" *ngIf="job">
      <!-- Header -->
      <header class="header">
        <div class="brand">
          <span class="logo">🛠️</span>
          <div>
            <h3>Image Mobiles Live Care</h3>
            <p>Token: {{ job.trackingToken }}</p>
          </div>
        </div>
      </header>

      <!-- Live Map & Floating ETA -->
      <div class="map-section">
        <div id="trackMap" class="map-view"></div>
        <div class="eta-bubble">
          <div class="icon">⚡</div>
          <div>
            <div class="time">~{{ job.etaMinutes }} mins</div>
            <div class="desc">{{ getStatusText(job.status) }}</div>
          </div>
        </div>
      </div>

      <!-- Technician Profile Card -->
      <div class="content-body">
        <div class="tech-card">
          <img [src]="job.technician.photoUrl" class="avatar" alt="Technician" />
          <div class="tech-info">
            <h4>{{ job.technician.name }}</h4>
            <p>Image Mobiles Certified Engineer</p>
            <p style="color: #38bdf8; font-size: 11px;">{{ job.technician.vehicle }}</p>
          </div>
          <a [href]="'tel:' + job.technician.phone" class="call-btn" title="Call Technician">📞</a>
        </div>

        <!-- Device Info -->
        <div class="card">
          <div class="card-title">Device Under Service</div>
          <div style="font-size: 14px; font-weight: 700; color: #fff;">{{ job.device }}</div>
          <div style="font-size: 12px; color: #94a3b8;">{{ job.serviceType }}</div>
        </div>

        <!-- Live Bill Breakdown -->
        <div class="card">
          <div class="card-title">
            <span>Estimated Bill Breakdown</span>
            <span class="live-pill">Live Sync</span>
          </div>
          <table class="bill-table">
            <tbody>
              <tr>
                <td>Inspection & Diagnostics</td>
                <td class="text-right">₹{{ job.pricing.baseEstimate }}</td>
              </tr>
              <tr *ngFor="let ch of job.pricing.additionalCharges" class="extra-line">
                <td>+ {{ ch.title }} <small>({{ ch.addedAt }})</small></td>
                <td class="text-right">₹{{ ch.amount }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Subtotal</td>
                <td class="text-right">₹{{ job.pricing.subtotal }}</td>
              </tr>
              <tr>
                <td>GST (18%)</td>
                <td class="text-right">₹{{ job.pricing.gstAmount }}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total Payable</strong></td>
                <td class="text-right total-price">₹{{ job.pricing.total }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Invoice Action Button -->
        <button *ngIf="job.status === 'completed'" class="btn btn-primary" style="width: 100%; padding: 14px;" (click)="showReceipt = true">
          📄 Download / View Official Tax Invoice
        </button>
      </div>

      <!-- Tax Invoice Modal -->
      <div class="modal-overlay" *ngIf="showReceipt">
        <div class="invoice-box">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 18px; color: #1e293b;">IMAGE MOBILES & COMPUTERS</h3>
              <p style="font-size: 11px; color: #64748b;">M.G. Road, Ernakulam • GSTIN: 32AABCU9603R1ZM</p>
            </div>
            <div style="text-align: right;">
              <span style="color: #2563eb; font-weight: 800;">TAX INVOICE</span>
              <p style="font-size: 11px; color: #64748b;">INV-{{ job.jobNumber }}</p>
            </div>
          </div>
          <div style="font-size: 12px; margin-bottom: 12px;">
            <strong>Customer:</strong> {{ job.customerName }}<br>
            <strong>Address:</strong> {{ job.destination.address }}
          </div>
          <table style="width: 100%; font-size: 12px; margin-bottom: 16px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0; padding: 6px 0;">
              <td>Total Amount (incl. 18% GST):</td>
              <td style="text-align: right; font-weight: bold; color: #2563eb;">₹{{ job.pricing.total }}</td>
            </tr>
          </table>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-outline" style="color: #0f172a; border-color: #cbd5e1;" (click)="printInvoice()">🖨️ Print</button>
            <button class="btn btn-primary" (click)="showReceipt = false">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mobile-container { max-width: 480px; margin: 0 auto; background: #0b0f19; min-height: 100vh; box-shadow: 0 0 40px rgba(0,0,0,0.5); }
    .header { background: #131b2e; border-bottom: 1px solid #2a374f; padding: 14px 18px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { font-size: 22px; }
    .brand h3 { font-size: 15px; font-weight: 800; color: #fff; }
    .brand p { font-size: 10px; color: #38bdf8; font-family: monospace; }
    
    .map-section { height: 260px; position: relative; width: 100%; }
    .map-view { height: 100%; width: 100%; }
    .eta-bubble {
      position: absolute; bottom: 12px; left: 16px; right: 16px;
      background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px);
      border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px;
      padding: 10px 14px; display: flex; align-items: center; gap: 12px; z-index: 500;
    }
    .eta-bubble .icon { font-size: 24px; }
    .eta-bubble .time { font-size: 18px; font-weight: 800; color: #38bdf8; }
    .eta-bubble .desc { font-size: 11px; color: #94a3b8; }
    
    .content-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .tech-card {
      background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 12px;
      display: flex; align-items: center; gap: 12px;
    }
    .avatar { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8; }
    .tech-info { flex: 1; }
    .tech-info h4 { font-size: 14px; font-weight: 700; color: #fff; }
    .tech-info p { font-size: 11px; color: #94a3b8; }
    .call-btn {
      width: 38px; height: 38px; border-radius: 50%; background: #10b981;
      display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 16px;
    }
    
    .card { background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; padding: 14px; }
    .card-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .live-pill { background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 9px; padding: 2px 6px; border-radius: 4px; }
    
    .bill-table { width: 100%; font-size: 12px; }
    .bill-table td { padding: 4px 0; color: #cbd5e1; }
    .text-right { text-align: right; }
    .extra-line td { color: #fbbf24; }
    .total-row td { border-top: 1px dashed #2a374f; padding-top: 8px; }
    .total-price { font-size: 16px; font-weight: 800; color: #38bdf8; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .invoice-box { background: #fff; color: #0f172a; width: 90%; max-width: 440px; border-radius: 16px; padding: 20px; }
  `]
})
export class TrackComponent implements OnInit, OnDestroy {
  job: CustomerTrackingJob | null = null;
  showReceipt = false;
  private map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private trackingService: CustomerTrackingService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') || 'IMG-7204-KL';
    this.trackingService.getJob(token).subscribe(job => {
      this.job = job;
      setTimeout(() => this.initMap(), 150);
    });
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  initMap(): void {
    const el = document.getElementById('trackMap');
    if (!el || !this.job) return;

    this.map = L.map('trackMap', { zoomControl: false, attributionControl: false }).setView([9.9950, 76.2950], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);

    L.marker([this.job.destination.latitude, this.job.destination.longitude]).addTo(this.map).bindPopup("<b>Your Address</b>");
    L.marker([this.job.technician.currentLocation.latitude, this.job.technician.currentLocation.longitude]).addTo(this.map).bindPopup("<b>Technician En Route</b>");
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'in_progress': return 'Technician is driving to your doorstep';
      case 'rescheduled_shop': return 'Transporting device to Central Repair Lab';
      case 'in_shop': return 'Under laboratory repair inspection';
      case 'out_for_delivery': return 'Repaired device out for delivery';
      case 'completed': return 'Service completed and delivered';
      default: return 'Technician assigned, preparing dispatch';
    }
  }

  printInvoice(): void {
    window.print();
  }
}
