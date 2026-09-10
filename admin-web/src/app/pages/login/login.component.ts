import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <!-- Brand Header -->
        <div class="brand-section">
          <div class="brand-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1 class="brand-title">Image Mobiles</h1>
          <p class="brand-subtitle">Field Service Operations Management</p>
        </div>

        <!-- Security Access Banner -->
        <div class="auth-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Authorized Staff & Branch Managers Only</span>
        </div>

        <!-- Error Notification -->
        <div class="error-banner" *ngIf="errorMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="handleSignIn()" class="login-form">
          <!-- Email Field -->
          <div class="form-field">
            <label class="field-label" for="admin-email">Administrator / Manager Email</label>
            <div class="input-container">
              <span class="field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="admin-email"
                type="email"
                class="text-input"
                [(ngModel)]="email"
                name="email"
                placeholder="name@imagemobiles.com"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-field">
            <label class="field-label" for="admin-password">Password</label>
            <div class="input-container">
              <span class="field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="admin-password"
                [type]="showPassword ? 'text' : 'password'"
                class="text-input has-action"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••••••"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="visibility-toggle"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                <!-- Eye open -->
                <svg *ngIf="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <!-- Eye off -->
                <svg *ngIf="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Action -->
          <button type="submit" class="submit-button" [disabled]="isLoading">
            <span *ngIf="!isLoading">Sign In to Dashboard →</span>
            <span *ngIf="isLoading" class="loading-state">
              <span class="spinner"></span>
              <span>Verifying Credentials...</span>
            </span>
          </button>
        </form>

        <!-- System Footer -->
        <div class="system-footer">
          <p>Restricted internal system. All login attempts are logged and monitored.</p>
          <div class="security-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Image Mobiles IT Security</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      height: 100vh;
      width: 100vw;
      overflow-y: auto;
      background: radial-gradient(ellipse at 50% 15%, #182647 0%, #080d1a 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      background: rgba(17, 26, 46, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 20px;
      padding: 40px 36px;
      box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.7), 0 0 40px rgba(37, 99, 235, 0.1);
      backdrop-filter: blur(20px);
    }

    /* Brand Section */
    .brand-section {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 6px;
    }

    /* Access Notice */
    .auth-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid #2a374f;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 11.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .auth-notice svg {
      color: #38bdf8;
      flex-shrink: 0;
    }

    /* Error Banner */
    .error-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .error-banner svg {
      flex-shrink: 0;
      color: #ef4444;
    }

    /* Form Fields */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .field-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #cbd5e1;
      letter-spacing: 0.01em;
    }

    .input-container {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2;
      transition: color 0.2s ease;
    }

    .text-input {
      width: 100%;
      height: 48px;
      background: #0b1222;
      border: 1.5px solid #25334d;
      border-radius: 12px;
      padding: 0 16px 0 44px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      color-scheme: dark;
      caret-color: #38bdf8;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
    }
    .text-input.has-action {
      padding-right: 44px;
    }
    .text-input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
      background: #0d1629;
    }
    .text-input:focus ~ .field-icon,
    .input-container:focus-within .field-icon {
      color: #38bdf8;
    }

    /* Specific WebKit Autofill Overrides for Login */
    .text-input:-webkit-autofill,
    .text-input:-webkit-autofill:hover, 
    .text-input:-webkit-autofill:focus, 
    .text-input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #0b1222 inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff !important;
      border-radius: 12px !important;
      border-color: #25334d !important;
      font-size: 14px !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .visibility-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.15s ease;
      z-index: 2;
    }
    .visibility-toggle:hover {
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
    }

    /* Submit Button */
    .submit-button {
      width: 100%;
      height: 48px;
      margin-top: 6px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
      transition: all 0.2s ease;
    }
    .submit-button:hover:not([disabled]) {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      box-shadow: 0 6px 22px rgba(37, 99, 235, 0.5);
      transform: translateY(-1px);
    }
    .submit-button:active:not([disabled]) {
      transform: translateY(0);
    }
    .submit-button[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* System Footer */
    .system-footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .system-footer p {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      max-width: 320px;
    }
    .security-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0b1222;
      border: 1px solid #1e293b;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10.5px;
      color: #38bdf8;
      font-weight: 600;
    }
  `]
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  async handleSignIn(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both your email address and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signIn(this.email, this.password);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (err: any) {
      this.errorMessage = err.message || 'Authentication failed. Please verify your credentials.';
    } finally {
      this.isLoading = false;
    }
  }
}
