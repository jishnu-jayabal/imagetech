import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Job, JobStatus, AdditionalCharge, Technician } from '../../models/admin.models';

@Component({
  selector: 'app-jobs-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Service Dispatches & Jobs</h1>
          <p>End-to-end service lifecycle, estimate approvals, parts billing, and field technician dispatching</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Create New Dispatch
        </button>
      </header>

      <!-- Filter Chips & Search Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search customer, phone, device, or job number..." [(ngModel)]="searchQuery" />
        </div>
        <div class="chips-row">
          <button class="chip" [class.active]="selectedStatus === 'ALL'" (click)="selectedStatus = 'ALL'">All</button>
          <button class="chip" [class.active]="selectedStatus === 'pending_estimate'" (click)="selectedStatus = 'pending_estimate'">Pending Estimate</button>
          <button class="chip" [class.active]="selectedStatus === 'assigned'" (click)="selectedStatus = 'assigned'">Assigned</button>
          <button class="chip" [class.active]="selectedStatus === 'in_progress'" (click)="selectedStatus = 'in_progress'">In Progress</button>
          <button class="chip" [class.active]="selectedStatus === 'in_shop'" (click)="selectedStatus = 'in_shop'">In Lab Repair</button>
          <button class="chip" [class.active]="selectedStatus === 'out_for_delivery'" (click)="selectedStatus = 'out_for_delivery'">Out for Delivery</button>
          <button class="chip" [class.active]="selectedStatus === 'completed'" (click)="selectedStatus = 'completed'">Completed</button>
          <button class="chip" [class.active]="selectedStatus === 'cancelled'" (click)="selectedStatus = 'cancelled'">Cancelled</button>
        </div>
      </div>

      <!-- Dispatches Table / Empty State -->
      <div class="content-card">
        <div *ngIf="filteredJobs.length === 0" class="empty-state">
          <span class="empty-icon">📦</span>
          <h4>No Service Dispatches Found</h4>
          <p *ngIf="searchQuery || selectedStatus !== 'ALL'">No jobs match your current search and filter criteria.</p>
          <p *ngIf="!searchQuery && selectedStatus === 'ALL'">You have not dispatched any jobs yet. Create your first customer request below.</p>
          <button class="btn btn-primary" style="margin-top: 14px;" (click)="openCreateModal()">
            + Create First Dispatch
          </button>
        </div>

        <div class="table-responsive" *ngIf="filteredJobs.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Job #</th>
                <th>Customer & Contact</th>
                <th>Device Details</th>
                <th>Status</th>
                <th>Total (incl. GST)</th>
                <th>Technician</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of filteredJobs">
                <td>
                  <strong style="color: #38bdf8; cursor: pointer;" (click)="viewJobDetails(job)">{{ job.jobNumber }}</strong>
                  <div style="font-size: 10px; color: #64748b;">{{ job.createdAt }}</div>
                </td>
                <td>
                  <div style="font-weight: 700;">{{ job.customer.name }}</div>
                  <div style="font-size: 11px; color: #94a3b8;">{{ job.customer.phone }}</div>
                  <div style="font-size: 11px; color: #cbd5e1; max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    {{ job.customer.address }}
                  </div>
                </td>
                <td>
                  <div><strong>{{ job.device.brand }} {{ job.device.model }}</strong></div>
                  <div style="font-size: 11px; color: #fbbf24;">{{ job.serviceType }}</div>
                </td>
                <td>
                  <span class="status-pill status-{{ job.status }}">● {{ formatStatus(job.status) }}</span>
                </td>
                <td>
                  <div><strong>₹{{ job.pricing.total | number:'1.0-0' }}</strong></div>
                  <div *ngIf="!job.pricing.estimateApproved" style="font-size: 10px; color: #fbbf24; font-weight: bold;">
                    Needs Approval
                  </div>
                  <div *ngIf="job.pricing.estimateApproved" style="font-size: 10px; color: #34d399;">
                    Approved
                  </div>
                </td>
                <td>
                  <span style="font-size: 12px; color: #cbd5e1;">{{ getTechName(job.technicianId) }}</span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-outline" (click)="viewJobDetails(job)">
                      Details
                    </button>
                    <button *ngIf="job.status === 'pending_estimate'" class="btn btn-sm btn-primary" (click)="openEstimateModal(job)">
                      Approve
                    </button>
                    <button *ngIf="job.status !== 'pending_estimate' && job.status !== 'completed' && job.status !== 'cancelled'" class="btn btn-sm btn-outline" (click)="openReassignModal(job)">
                      Reassign
                    </button>
                    <a [href]="'http://localhost:4300/track/' + job.trackingToken" target="_blank" class="btn btn-sm btn-outline" title="Open Customer Live Tracking Page">
                      🔗 Track
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: CREATE NEW DISPATCH -->
      <div class="modal-overlay" *ngIf="showCreateModal">
        <div class="modal-box" style="max-width: 620px;">
          <div class="modal-header">
            <h4>Create Service Dispatch</h4>
            <button class="btn btn-sm btn-outline" (click)="showCreateModal = false">✕</button>
          </div>
          <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label class="form-label">Customer Full Name *</label>
              <input type="text" class="form-input" [(ngModel)]="newJob.customerName" placeholder="e.g. Rahul Menon" />
            </div>
            <div>
              <label class="form-label">Customer Phone * (10 Digits)</label>
              <input type="text" class="form-input" [(ngModel)]="newJob.customerPhone" placeholder="e.g. 9847098123" />
            </div>
            <div style="grid-column: span 2;">
              <label class="form-label">Service Address & Landmark *</label>
              <input type="text" class="form-input" [(ngModel)]="newJob.customerAddress" placeholder="e.g. 14/B, Lotus Apartments, MG Road, Ernakulam" />
            </div>
            <div>
              <label class="form-label">Device Brand & Model *</label>
              <input type="text" class="form-input" [(ngModel)]="newJob.deviceModel" placeholder="e.g. iPhone 15 Pro / Galaxy S24" />
            </div>
            <div>
              <label class="form-label">Device Color</label>
              <input type="text" class="form-input" [(ngModel)]="newJob.deviceColor" placeholder="e.g. Titanium Black" />
            </div>
            <div>
              <label class="form-label">Service Branch</label>
              <select class="form-input" [(ngModel)]="newJob.branchId">
                <option value="">Central Hub</option>
                <option *ngFor="let b of branches$ | async" [value]="b.id">{{ b.name }} ({{ b.code }})</option>
              </select>
            </div>
            <div>
              <label class="form-label">Assign Technician</label>
              <select class="form-input" [(ngModel)]="newJob.technicianId">
                <option value="">Leave Unassigned (Queue)</option>
                <option *ngFor="let t of technicians$ | async" [value]="t.id">{{ t.name }} ({{ t.vehicleNumber }})</option>
              </select>
            </div>
            <div>
              <label class="form-label">Initial Estimate (₹) *</label>
              <input type="number" class="form-input" [(ngModel)]="newJob.baseEstimate" />
            </div>
            <div>
              <label class="form-label">Estimate Approved by Manager?</label>
              <select class="form-input" [(ngModel)]="newJob.isApproved">
                <option [ngValue]="true">Yes - Approved & Ready for Dispatch</option>
                <option [ngValue]="false">No - Keep in Pending Estimate</option>
              </select>
            </div>
            <div style="grid-column: span 2;">
              <label class="form-label">Service Category</label>
              <select class="form-input" [(ngModel)]="newJob.serviceType">
                <option value="Doorstep Screen & Display Service">Doorstep Screen & Display Service</option>
                <option value="Original Battery Replacement">Original Battery Replacement</option>
                <option value="Motherboard Diagnostics & Chip Repair">Motherboard Diagnostics & Chip Repair</option>
                <option value="Water Damage Decontamination">Water Damage Decontamination</option>
                <option value="Speaker, Mic & Charging Port Service">Speaker, Mic & Charging Port Service</option>
              </select>
            </div>
            <div style="grid-column: span 2;">
              <label class="form-label">Issue Description & Reported Symptoms</label>
              <textarea class="form-input" [(ngModel)]="newJob.issueDescription" rows="2" placeholder="e.g. Touch unresponsive after drop, glass cracked"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showCreateModal = false" [disabled]="isSubmitting">Cancel</button>
            <button class="btn btn-primary" (click)="submitCreateJob()" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm" style="display: inline-block; width: 13px; height: 13px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: middle;"></span>
              {{ isSubmitting ? 'Saving Dispatch...' : 'Save Dispatch & Sync to Firestore' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: APPROVE / EDIT ESTIMATE -->
      <div class="modal-overlay" *ngIf="selectedJobForEstimate">
        <div class="modal-box">
          <div class="modal-header">
            <h4>Approve Estimate: {{ selectedJobForEstimate.jobNumber }}</h4>
            <button class="btn btn-sm btn-outline" (click)="selectedJobForEstimate = null">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
              Per company guardrail, jobs cannot proceed until the branch manager approves the initial diagnosis estimate.
            </p>
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; color: #94a3b8;">Customer & Device:</span>
              <strong> {{ selectedJobForEstimate.customer.name }} ({{ selectedJobForEstimate.device.brand }} {{ selectedJobForEstimate.device.model }})</strong>
            </div>
            <div>
              <label class="form-label">Approved Base Estimate (₹):</label>
              <input type="number" class="form-input" [(ngModel)]="editAmount" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="selectedJobForEstimate = null" [disabled]="isApproving">Cancel</button>
            <button class="btn btn-primary" (click)="saveEstimate()" [disabled]="isApproving">
              <span *ngIf="isApproving" class="spinner-border spinner-border-sm" style="display: inline-block; width: 13px; height: 13px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: middle;"></span>
              {{ isApproving ? 'Approving...' : 'Approve & Update Firestore' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: REASSIGN TECHNICIAN -->
      <div class="modal-overlay" *ngIf="selectedJobForReassign">
        <div class="modal-box">
          <div class="modal-header">
            <h4>Reassign Job: {{ selectedJobForReassign.jobNumber }}</h4>
            <button class="btn btn-sm btn-outline" (click)="selectedJobForReassign = null">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-label">Select Field Technician:</label>
            <select class="form-input" [(ngModel)]="reassignTechId">
              <option *ngFor="let tech of technicians$ | async" [value]="tech.id">
                {{ tech.name }} — {{ tech.vehicleType }} ({{ tech.vehicleNumber }}) [{{ tech.status }}]
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="selectedJobForReassign = null" [disabled]="isReassigning">Cancel</button>
            <button class="btn btn-primary" (click)="saveReassign()" [disabled]="isReassigning">
              <span *ngIf="isReassigning" class="spinner-border spinner-border-sm" style="display: inline-block; width: 13px; height: 13px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: middle;"></span>
              {{ isReassigning ? 'Reassigning...' : 'Confirm Reassignment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- DRAWER / MODAL: JOB DETAILS, CHARGES & AUDIT -->
      <div class="modal-overlay" *ngIf="detailJob">
        <div class="modal-box" style="max-width: 660px;">
          <div class="modal-header">
            <div>
              <h4>Job Details: {{ detailJob.jobNumber }}</h4>
              <span class="status-pill status-{{ detailJob.status }}">● {{ formatStatus(detailJob.status) }}</span>
            </div>
            <button class="btn btn-sm btn-outline" (click)="detailJob = null">✕</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 75vh; overflow-y: auto;">
            
            <!-- 1. CURRENT STAGE & LIFECYCLE TRACKER -->
            <div class="stage-tracker-box">
              <div class="stage-tracker-header">
                <span class="stage-tag">CURRENT STAGE: {{ formatStatus(detailJob.status) | uppercase }}</span>
                <span class="stage-step-num">Stage {{ getStageIndex(detailJob.status) }} of 6</span>
              </div>
              <p class="stage-desc">{{ getStageDescription(detailJob.status) }}</p>

              <!-- Stepper Timeline -->
              <div class="stepper-track">
                <div 
                  *ngFor="let stage of getStages(); let last = last" 
                  class="stepper-node" 
                  [class.active]="stage.key === detailJob.status || (stage.key === 'in_shop' && detailJob.status === 'rescheduled_shop')"
                  [class.passed]="getStageIndex(detailJob.status) > stage.index"
                >
                  <div class="node-circle">
                    <span *ngIf="getStageIndex(detailJob.status) > stage.index">✓</span>
                    <span *ngIf="getStageIndex(detailJob.status) <= stage.index">{{ stage.icon }}</span>
                  </div>
                  <span class="node-label">{{ stage.label }}</span>
                  <div *ngIf="!last" class="node-connector" [class.passed]="getStageIndex(detailJob.status) > stage.index"></div>
                </div>
              </div>
            </div>

            <!-- 2. ASSIGNED TECHNICIAN DETAILS -->
            <div class="tech-detail-card" *ngIf="getTech(detailJob.technicianId) as tech">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="tech-avatar">
                    {{ tech.name.slice(0, 2).toUpperCase() }}
                    <span class="duty-badge" [class.available]="tech.status === 'available'" [class.on-duty]="tech.status === 'on_duty'" [class.offline]="tech.status === 'offline'"></span>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <h4 style="margin: 0; color: #fff; font-size: 14px;">{{ tech.name }}</h4>
                      <span class="rating-pill">★ {{ tech.rating || 5.0 }}</span>
                      <span style="font-size: 11px; text-transform: uppercase; color: #10b981; font-weight: bold;" *ngIf="tech.status === 'available'">● Available</span>
                      <span style="font-size: 11px; text-transform: uppercase; color: #fbbf24; font-weight: bold;" *ngIf="tech.status === 'on_duty'">● On Duty</span>
                      <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;" *ngIf="tech.status === 'offline'">● Offline</span>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 4px; font-size: 11.5px; color: #94a3b8; flex-wrap: wrap;">
                      <a [href]="'tel:' + tech.phone" style="color: #38bdf8; text-decoration: none; font-weight: 600;">📞 {{ tech.phone }}</a>
                      <span *ngIf="tech.email">✉️ {{ tech.email }}</span>
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 3px;">
                      🛵 {{ tech.vehicleType }} <strong style="color: #38bdf8;">({{ tech.vehicleNumber }})</strong> • {{ tech.completedJobsCount || 0 }} Jobs Done
                    </div>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline" style="font-size: 11px; padding: 4px 10px;" (click)="openReassignModal(detailJob)">
                  🔁 Reassign
                </button>
              </div>
            </div>

            <!-- If NO Technician is Assigned -->
            <div class="unassigned-alert" *ngIf="!getTech(detailJob.technicianId)">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <div>
                  <div style="color: #f59e0b; font-weight: 700; font-size: 13px;">No Technician Assigned</div>
                  <div style="color: #94a3b8; font-size: 11px;">This service ticket is waiting unassigned in the dispatch queue.</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary" (click)="openReassignModal(detailJob)">
                + Assign Technician
              </button>
            </div>

            <!-- Customer info -->
            <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <strong>Customer Information:</strong>
                <a [href]="'tel:' + detailJob.customer.phone" style="color: #38bdf8; font-size: 12px; text-decoration: none;">📞 Call Customer</a>
              </div>
              <div style="font-size: 13px; margin-top: 4px;">{{ detailJob.customer.name }} ({{ detailJob.customer.phone }})</div>
              <div style="font-size: 12px; color: #94a3b8;">{{ detailJob.customer.address }}</div>
            </div>

            <!-- Device info -->
            <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
              <strong>Device & Problem:</strong>
              <div style="font-size: 13px; margin-top: 4px;">{{ detailJob.device.brand }} {{ detailJob.device.model }} ({{ detailJob.device.color }})</div>
              <div style="font-size: 12px; color: #fbbf24; margin-top: 2px;">{{ detailJob.issueDescription }}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Service Type: {{ detailJob.serviceType }}</div>
            </div>

            <!-- Invoicing Breakdown -->
            <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Itemized Invoice & Charges:</strong>
                <button class="btn btn-sm btn-outline" (click)="showAddChargeRow = !showAddChargeRow">+ Add Part / Labor</button>
              </div>

              <!-- Add Charge Form -->
              <div *ngIf="showAddChargeRow" style="margin-top: 10px; padding: 10px; background: #131b2e; border-radius: 6px; display: flex; gap: 8px; align-items: flex-end;">
                <div style="flex: 2;">
                  <label class="form-label">Part / Labor Description</label>
                  <input type="text" class="form-input" [(ngModel)]="newChargeTitle" placeholder="e.g. Original OLED Panel" />
                </div>
                <div style="flex: 1;">
                  <label class="form-label">Cost (₹)</label>
                  <input type="number" class="form-input" [(ngModel)]="newChargeAmount" placeholder="1500" />
                </div>
                <button class="btn btn-sm btn-primary" (click)="submitAddCharge()">Add</button>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 8px;">
                <span>Base Diagnostic & Service:</span>
                <span>₹{{ detailJob.pricing.baseEstimate }}</span>
              </div>

              <div *ngFor="let ch of detailJob.pricing.additionalCharges" style="display: flex; justify-content: space-between; font-size: 12px; color: #fbbf24; margin-top: 4px;">
                <span>+ {{ ch.title }}:</span>
                <span>₹{{ ch.amount }}</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-top: 4px; border-top: 1px dashed #2a374f; padding-top: 4px;">
                <span>GST (18% statutory):</span>
                <span>₹{{ ((detailJob.pricing.subtotal || 0) * 0.18) | number:'1.0-0' }}</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #2a374f; margin-top: 6px; padding-top: 6px; color: #34d399;">
                <span>Total Payable:</span>
                <span>₹{{ detailJob.pricing.total | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Quick Status Change Actions -->
            <div>
              <label class="form-label">Update Job Status:</label>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button class="btn btn-sm btn-outline" [class.btn-primary]="detailJob.status === 'assigned'" (click)="setStatus(detailJob, 'assigned')">Assigned</button>
                <button class="btn btn-sm btn-outline" [class.btn-primary]="detailJob.status === 'in_progress'" (click)="setStatus(detailJob, 'in_progress')">In Progress</button>
                <button class="btn btn-sm btn-outline" [class.btn-primary]="detailJob.status === 'in_shop'" (click)="setStatus(detailJob, 'in_shop')">In Lab</button>
                <button class="btn btn-sm btn-outline" [class.btn-primary]="detailJob.status === 'out_for_delivery'" (click)="setStatus(detailJob, 'out_for_delivery')">Out for Delivery</button>
                <button class="btn btn-sm btn-outline" style="color: #34d399;" [class.btn-primary]="detailJob.status === 'completed'" (click)="setStatus(detailJob, 'completed')">Completed</button>
                <button class="btn btn-sm btn-outline" style="color: #ef4444;" [class.btn-primary]="detailJob.status === 'cancelled'" (click)="setStatus(detailJob, 'cancelled')">Cancel</button>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-sm btn-outline" style="color: #ef4444;" (click)="deleteJob(detailJob)">🗑️ Delete Dispatch</button>
            <div style="display: flex; gap: 8px;">
              <a [href]="'http://localhost:4300/track/' + detailJob.trackingToken" target="_blank" class="btn btn-sm btn-primary">
                Open Customer Tracking Page ↗
              </a>
              <button class="btn btn-sm btn-outline" (click)="detailJob = null">Close</button>
            </div>
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

    .filter-bar { display: flex; flex-direction: column; gap: 12px; }
    .search-box {
      display: flex; align-items: center; gap: 10px; background: #0f172a; border: 1px solid #2a374f;
      border-radius: 10px; padding: 0 14px; height: 44px;
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
    .chips-row { display: flex; gap: 8px; overflow-x: auto; }
    .chip {
      background: #1e293b; border: 1px solid #2a374f; color: #94a3b8; padding: 6px 14px;
      border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .chip.active { background: #2563eb; color: #fff; border-color: #2563eb; }

    .content-card { background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; overflow: hidden; }
    .empty-state { padding: 50px 20px; text-align: center; color: #94a3b8; }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
    .empty-state h4 { font-size: 16px; color: #fff; font-weight: 700; }
    .empty-state p { font-size: 12px; margin-top: 4px; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    .data-table th { background: rgba(15, 23, 42, 0.6); padding: 12px 18px; color: #94a3b8; border-bottom: 1px solid #2a374f; }
    .data-table td { padding: 14px 18px; border-bottom: 1px solid #1e293b; }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }

    .modal-header { padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 14px 20px; border-top: 1px solid #2a374f; display: flex; justify-content: flex-end; gap: 8px; }

    /* Current Stage Tracker */
    .stage-tracker-box {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.95));
      border: 1px solid #2a374f;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .stage-tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stage-tag {
      font-size: 11px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.5px;
    }
    .stage-step-num {
      font-size: 11px;
      color: #94a3b8;
      background: #1e293b;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid #334155;
    }
    .stage-desc {
      font-size: 12px;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.4;
    }
    .stepper-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      margin-top: 4px;
      padding: 0 4px;
    }
    .stepper-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      z-index: 1;
    }
    .node-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #1e293b;
      border: 2px solid #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #94a3b8;
      transition: all 0.2s;
    }
    .stepper-node.active .node-circle {
      background: #2563eb;
      border-color: #38bdf8;
      color: #fff;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
      transform: scale(1.15);
    }
    .stepper-node.passed .node-circle {
      background: #065f46;
      border-color: #10b981;
      color: #34d399;
      font-weight: bold;
    }
    .node-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 5px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .stepper-node.active .node-label {
      color: #38bdf8;
      font-weight: 700;
    }
    .stepper-node.passed .node-label {
      color: #94a3b8;
    }
    .node-connector {
      position: absolute;
      top: 14px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: #2a374f;
      z-index: -1;
    }
    .node-connector.passed {
      background: #10b981;
    }

    /* Technician Details in Job Modal */
    .tech-detail-card {
      background: #0f172a;
      border: 1px solid #2563eb;
      border-radius: 10px;
      padding: 12px;
    }
    .tech-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #2563eb;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }
    .duty-badge {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      position: absolute;
      bottom: -1px;
      right: -1px;
      border: 2px solid #0f172a;
    }
    .duty-badge.available { background: #10b981; }
    .duty-badge.on-duty { background: #fbbf24; }
    .duty-badge.offline { background: #64748b; }
    .rating-pill {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      font-size: 10.5px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .unassigned-alert {
      background: rgba(245, 158, 11, 0.08);
      border: 1px dashed #f59e0b;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class JobsPageComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);

  jobs$ = this.adminService.getJobs();
  technicians$ = this.adminService.getTechnicians();
  branches$ = this.adminService.getBranches();

  searchQuery = '';
  selectedStatus = 'ALL';
  selectedJobForEstimate: Job | null = null;
  selectedJobForReassign: Job | null = null;
  detailJob: Job | null = null;
  editAmount: number = 0;
  reassignTechId: string = '';
  showCreateModal = false;

  isSubmitting = false;
  isApproving = false;
  isReassigning = false;

  allTechs: Technician[] = [];

  ngOnInit(): void {
    this.technicians$.subscribe(t => this.allTechs = t);
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create' || params['create'] === 'true') {
        setTimeout(() => this.openCreateModal(), 150);
      }
    });
  }

  getTech(techId: string): Technician | undefined {
    if (!techId) return undefined;
    return this.allTechs.find(t => t.id === techId);
  }

  getStages() {
    return [
      { key: 'pending_estimate', label: 'Estimate', icon: '📝', index: 1 },
      { key: 'assigned', label: 'Assigned', icon: '👤', index: 2 },
      { key: 'in_progress', label: 'In Progress', icon: '⚡', index: 3 },
      { key: 'in_shop', label: 'In Lab', icon: '🔬', index: 4 },
      { key: 'out_for_delivery', label: 'Delivery', icon: '🛵', index: 5 },
      { key: 'completed', label: 'Completed', icon: '✅', index: 6 }
    ];
  }

  getStageIndex(status: string): number {
    switch (status) {
      case 'pending_estimate': return 1;
      case 'assigned': return 2;
      case 'in_progress': return 3;
      case 'in_shop':
      case 'rescheduled_shop': return 4;
      case 'out_for_delivery': return 5;
      case 'completed': return 6;
      case 'cancelled': return 0;
      default: return 1;
    }
  }

  getStageDescription(status: string): string {
    switch (status) {
      case 'pending_estimate':
        return 'Stage 1 of 6: Awaiting manager diagnosis and customer estimate approval before dispatch.';
      case 'assigned':
        return 'Stage 2 of 6: Assigned to field technician. Doorstep dispatch scheduled.';
      case 'in_progress':
        return 'Stage 3 of 6: Technician is currently on-site performing diagnosis and hardware service.';
      case 'in_shop':
      case 'rescheduled_shop':
        return 'Stage 4 of 6: Device transferred to central lab facility for specialized micro-soldering / parts.';
      case 'out_for_delivery':
        return 'Stage 5 of 6: Hardware repair verified by QA. En route for return handover.';
      case 'completed':
        return 'Stage 6 of 6: Handover signature obtained and payment settled. Service completed.';
      case 'cancelled':
        return 'Job Cancelled: Ticket closed prior to service completion.';
      default:
        return 'Current status: ' + this.formatStatus(status);
    }
  }

  showAddChargeRow = false;
  newChargeTitle = '';
  newChargeAmount: number = 0;

  newJob = {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deviceModel: '',
    deviceColor: '',
    serviceType: 'Doorstep Screen & Display Service',
    issueDescription: '',
    baseEstimate: 1200,
    isApproved: true,
    branchId: '',
    technicianId: ''
  };

  get filteredJobs(): Job[] {
    let jobs: Job[] = [];
    this.jobs$.subscribe(j => jobs = j);

    return jobs.filter(job => {
      const matchesStatus = this.selectedStatus === 'ALL' || job.status === this.selectedStatus;
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = !q || 
        job.jobNumber.toLowerCase().includes(q) ||
        job.customer.name.toLowerCase().includes(q) ||
        job.customer.phone.includes(q) ||
        job.device.brand.toLowerCase().includes(q) ||
        job.device.model.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }

  getTechName(techId: string): string {
    if (!techId) return 'Unassigned';
    let name = 'Technician';
    this.technicians$.subscribe(techs => {
      const found = techs.find(t => t.id === techId);
      if (found) name = found.name;
    });
    return name;
  }

  formatStatus(s: string): string {
    return s ? s.replace('_', ' ') : '';
  }

  openCreateModal(): void {
    let defaultBranchId = '';
    let defaultTechId = '';
    this.branches$.subscribe(b => { if (b.length > 0) defaultBranchId = b[0].id; });
    this.technicians$.subscribe(t => { if (t.length > 0) defaultTechId = t[0].id; });

    this.newJob = {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deviceModel: '',
      deviceColor: '',
      serviceType: 'Doorstep Screen & Display Service',
      issueDescription: '',
      baseEstimate: 1200,
      isApproved: true,
      branchId: defaultBranchId,
      technicianId: defaultTechId
    };
    this.showCreateModal = true;
  }

  async submitCreateJob(): Promise<void> {
    if (this.isSubmitting) return;
    if (!this.newJob.customerName || !this.newJob.customerPhone) {
      alert('Customer Name and Mobile Number are required.');
      return;
    }

    try {
      this.isSubmitting = true;
      await this.adminService.createJob({
        branchId: this.newJob.branchId,
        technicianId: this.newJob.technicianId,
        customer: {
          name: this.newJob.customerName,
          phone: this.newJob.customerPhone,
          address: this.newJob.customerAddress || 'Kochi, Kerala',
          location: { latitude: 9.9830, longitude: 76.2865 }
        },
        device: {
          brand: this.newJob.deviceModel.split(' ')[0] || 'Mobile',
          model: this.newJob.deviceModel || 'Smartphone',
          color: this.newJob.deviceColor || 'Black'
        },
        serviceType: this.newJob.serviceType,
        issueDescription: this.newJob.issueDescription || 'Diagnostic requested',
        status: this.newJob.isApproved ? 'assigned' : 'pending_estimate',
        pricing: {
          baseEstimate: this.newJob.baseEstimate,
          estimateApproved: this.newJob.isApproved,
          additionalCharges: [],
          subtotal: this.newJob.baseEstimate,
          gstRate: 0.18,
          total: this.newJob.baseEstimate * 1.18
        }
      });
      this.showCreateModal = false;
    } catch (err: any) {
      alert('Failed to create dispatch: ' + (err.message || err));
    } finally {
      this.isSubmitting = false;
    }
  }

  openEstimateModal(job: Job): void {
    this.selectedJobForEstimate = job;
    this.editAmount = job.pricing.baseEstimate;
  }

  async saveEstimate(): Promise<void> {
    if (this.isApproving) return;
    if (this.selectedJobForEstimate && this.editAmount > 0) {
      try {
        this.isApproving = true;
        await this.adminService.approveEstimate(this.selectedJobForEstimate.id, this.editAmount);
        this.selectedJobForEstimate = null;
      } catch (err: any) {
        alert('Failed to approve estimate: ' + (err.message || err));
      } finally {
        this.isApproving = false;
      }
    }
  }

  openReassignModal(job: Job): void {
    this.selectedJobForReassign = job;
    this.reassignTechId = job.technicianId;
  }

  async saveReassign(): Promise<void> {
    if (this.isReassigning) return;
    if (this.selectedJobForReassign && this.reassignTechId) {
      try {
        this.isReassigning = true;
        await this.adminService.reassignTechnician(this.selectedJobForReassign.id, this.reassignTechId);
        if (this.detailJob && this.detailJob.id === this.selectedJobForReassign.id) {
          this.detailJob.technicianId = this.reassignTechId;
        }
        this.selectedJobForReassign = null;
      } catch (err: any) {
        alert('Failed to reassign technician: ' + (err.message || err));
      } finally {
        this.isReassigning = false;
      }
    }
  }

  viewJobDetails(job: Job): void {
    this.detailJob = job;
    this.showAddChargeRow = false;
    this.newChargeTitle = '';
    this.newChargeAmount = 0;
  }

  async submitAddCharge(): Promise<void> {
    if (!this.detailJob || !this.newChargeTitle || !this.newChargeAmount) {
      alert('Please enter charge title and amount');
      return;
    }

    await this.adminService.addJobCharge(this.detailJob.id, {
      title: this.newChargeTitle,
      amount: Number(this.newChargeAmount)
    });

    // Update local detail view
    const currentCharges = this.detailJob.pricing.additionalCharges || [];
    const added: AdditionalCharge = {
      id: `ch_${Date.now()}`,
      title: this.newChargeTitle,
      amount: Number(this.newChargeAmount),
      addedAt: 'Now'
    };
    this.detailJob.pricing.additionalCharges = [...currentCharges, added];
    this.detailJob.pricing.subtotal = (this.detailJob.pricing.baseEstimate || 0) + this.detailJob.pricing.additionalCharges.reduce((s, c) => s + c.amount, 0);
    this.detailJob.pricing.total = this.detailJob.pricing.subtotal * 1.18;

    this.showAddChargeRow = false;
    this.newChargeTitle = '';
    this.newChargeAmount = 0;
  }

  async setStatus(job: Job, status: JobStatus): Promise<void> {
    await this.adminService.updateJobStatus(job.id, status);
    if (this.detailJob && this.detailJob.id === job.id) {
      this.detailJob.status = status;
    }
  }

  async deleteJob(job: Job): Promise<void> {
    if (confirm(`Are you sure you want to permanently delete job ${job.jobNumber}?`)) {
      await this.adminService.deleteJob(job.id);
      this.detailJob = null;
    }
  }
}
