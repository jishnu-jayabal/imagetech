import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>Super Administrator Profile & Security</h1>
          <p>Master account settings, password management, and security credentials</p>
        </div>
      </header>

      <div class="settings-grid">
        <!-- LEFT COLUMN: Profile & Display Name -->
        <div class="content-card">
          <div class="card-header">
            <h3>Admin Identity & Role</h3>
            <span class="role-badge">SUPER ADMIN (All Branches)</span>
          </div>
          <div class="card-body">
            <div class="profile-header">
              <div class="avatar-lg">
                {{ getInitials((currentUser$ | async)?.displayName || (currentUser$ | async)?.email || 'SA') }}
              </div>
              <div class="profile-meta">
                <h4>{{ (currentUser$ | async)?.displayName || 'Super Administrator' }}</h4>
                <p class="email-sub">{{ (currentUser$ | async)?.email }}</p>
                <span class="scope-tag">Company-Wide Authority: Full Access to All Branches</span>
              </div>
            </div>

            <!-- Edit Display Name -->
            <div class="name-edit-box">
              <label class="form-label">Super Admin Display Name</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="form-input" [(ngModel)]="newDisplayName" placeholder="Enter display name" />
                <button class="btn btn-outline" [disabled]="isSavingName" (click)="saveDisplayName()">
                  {{ isSavingName ? 'Saving...' : 'Update Name' }}
                </button>
              </div>
              <span *ngIf="nameSuccessMsg" class="success-note">{{ nameSuccessMsg }}</span>
            </div>

            <!-- Security Info -->
            <div class="meta-list">
              <div class="meta-row">
                <span class="meta-label">Firebase Auth UID:</span>
                <span class="meta-val code">{{ (currentUser$ | async)?.uid }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Authority Level:</span>
                <span class="meta-val" style="color: #38bdf8;">Super Administrator (Root)</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Project Scope:</span>
                <span class="meta-val">imagemobiles-45aeb</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Change Master Password -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3>Change Master Password</h3>
              <p style="font-size: 11px; color: #94a3b8;">Updates your login credentials directly in Google Firebase Auth</p>
            </div>
            <span class="lock-pill">🔒 Firebase SSL</span>
          </div>
          <div class="card-body">
            <div class="alert-box success" *ngIf="passwordSuccessMsg">
              <span>✅</span>
              <p>{{ passwordSuccessMsg }}</p>
            </div>
            <div class="alert-box error" *ngIf="passwordErrorMsg">
              <span>⚠️</span>
              <p>{{ passwordErrorMsg }}</p>
            </div>

            <form (ngSubmit)="handlePasswordChange()">
              <div class="form-group">
                <label class="form-label">New Password (Min 6 characters)</label>
                <div class="input-wrapper">
                  <input 
                    [type]="showNewPassword ? 'text' : 'password'" 
                    class="form-input" 
                    [(ngModel)]="newPassword" 
                    name="newPassword" 
                    placeholder="Enter new strong password" 
                    required 
                  />
                  <button type="button" class="toggle-eye" (click)="showNewPassword = !showNewPassword">
                    {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <div class="input-wrapper">
                  <input 
                    [type]="showConfirmPassword ? 'text' : 'password'" 
                    class="form-input" 
                    [(ngModel)]="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="Confirm new password" 
                    required 
                  />
                  <button type="button" class="toggle-eye" (click)="showConfirmPassword = !showConfirmPassword">
                    {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 6px;" [disabled]="isUpdatingPassword">
                <span *ngIf="!isUpdatingPassword">🔒 Update Master Password in Firebase</span>
                <span *ngIf="isUpdatingPassword">Updating Credentials...</span>
              </button>
            </form>

            <div class="security-note">
              <p>🛡️ Your password is encrypted with Google Firebase Auth. After updating, your session stays active automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header h1 { font-size: 20px; font-weight: 800; color: #fff; }
    .page-header p { font-size: 12px; color: #94a3b8; }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .content-card { background: #131b2e; border: 1px solid #2a374f; border-radius: 12px; overflow: hidden; }
    .card-header {
      padding: 16px 20px; border-bottom: 1px solid #2a374f; display: flex;
      justify-content: space-between; align-items: center;
    }
    .card-header h3 { font-size: 14px; font-weight: 700; color: #fff; }
    .card-body { padding: 20px; }

    .role-badge {
      background: rgba(37, 99, 235, 0.2); color: #38bdf8; font-size: 11px;
      font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .lock-pill { background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }

    .profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .avatar-lg {
      width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #38bdf8);
      color: #fff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.4); flex-shrink: 0;
    }
    .profile-meta h4 { font-size: 16px; font-weight: 700; color: #fff; }
    .email-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .scope-tag {
      display: inline-block; font-size: 11px; color: #34d399; font-weight: 600; margin-top: 4px;
    }

    .name-edit-box { border-top: 1px solid #1e293b; padding-top: 14px; }
    .success-note { display: block; font-size: 11px; color: #34d399; margin-top: 6px; }

    .meta-list { margin-top: 18px; border-top: 1px solid #1e293b; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 12px; }
    .meta-label { color: #64748b; }
    .meta-val { color: #fff; font-weight: 600; }
    .meta-val.code { font-family: monospace; font-size: 11px; color: #cbd5e1; }

    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px; }
    .input-wrapper {
      position: relative; display: flex; align-items: center;
      background: #0f172a; border: 1px solid #2a374f; border-radius: 10px; height: 44px;
      transition: all 0.2s ease;
    }
    .input-wrapper:focus-within {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
      background: #111c33;
    }
    .input-wrapper .form-input {
      border: none !important; background: transparent !important; box-shadow: none !important; height: 100%;
    }
    .toggle-eye {
      background: transparent; border: none; padding: 0 14px; cursor: pointer; font-size: 14px; outline: none;
      display: flex; align-items: center; justify-content: center; color: #94a3b8;
    }

    .alert-box {
      padding: 10px 14px; border-radius: 8px; font-size: 12px; display: flex;
      align-items: center; gap: 8px; margin-bottom: 14px;
    }
    .alert-box.success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); color: #6ee7b7; }
    .alert-box.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; }

    .security-note {
      margin-top: 16px; padding: 12px; background: rgba(15, 23, 42, 0.6);
      border-radius: 8px; border: 1px solid #1e293b; font-size: 11px; color: #94a3b8; line-height: 1.4;
    }
  `]
})
export class SettingsPageComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  newDisplayName = '';
  isSavingName = false;
  nameSuccessMsg = '';

  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  isUpdatingPassword = false;
  passwordSuccessMsg = '';
  passwordErrorMsg = '';

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.displayName) {
      this.newDisplayName = user.displayName;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'SA';
    return name.slice(0, 2).toUpperCase();
  }

  async saveDisplayName(): Promise<void> {
    if (!this.newDisplayName.trim()) return;
    this.isSavingName = true;
    this.nameSuccessMsg = '';
    try {
      await this.authService.updateProfile(this.newDisplayName.trim());
      this.nameSuccessMsg = 'Display name updated successfully!';
      setTimeout(() => this.nameSuccessMsg = '', 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update name');
    } finally {
      this.isSavingName = false;
    }
  }

  async handlePasswordChange(): Promise<void> {
    this.passwordSuccessMsg = '';
    this.passwordErrorMsg = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.passwordErrorMsg = 'Please enter and confirm your new password.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordErrorMsg = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorMsg = 'The two passwords do not match. Please re-enter.';
      return;
    }

    this.isUpdatingPassword = true;

    try {
      await this.authService.updatePassword(this.newPassword);
      this.passwordSuccessMsg = 'Your master password has been successfully updated in Firebase Auth!';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      this.passwordErrorMsg = err.message || 'Failed to update password in Firebase.';
    } finally {
      this.isUpdatingPassword = false;
    }
  }
}
