import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <!-- Persistent Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <div class="logo">🛠️</div>
          <div class="brand-text">
            <h3>Image Mobiles</h3>
            <p>Field Service Cloud</p>
          </div>
        </div>

        <nav class="nav-menu">
          <div class="nav-heading">OPERATIONS</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📊</span>
            <span>Fleet Dashboard</span>
          </a>
          <a routerLink="/jobs" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📋</span>
            <span>Service Dispatches</span>
          </a>
          <a routerLink="/technicians" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">🛵</span>
            <span>Field Technicians</span>
          </a>

          <div class="nav-heading" style="margin-top: 16px;">MANAGEMENT</div>
          <a routerLink="/branches" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">🏢</span>
            <span>Branches & Hubs</span>
          </a>
          <a routerLink="/branch-managers" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">👥</span>
            <span>Branch Managers</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📑</span>
            <span>Reports & GST</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">⚙️</span>
            <span>Security & Profile</span>
          </a>
        </nav>

        <!-- Authenticated Manager Profile & Sign Out -->
        <div class="sidebar-footer">
          <div class="user-pill" routerLink="/settings" style="cursor: pointer;" title="Open Super Admin Profile & Password Settings">
            <div class="user-avatar">{{ getInitials((currentUser$ | async)?.displayName || (currentUser$ | async)?.email || 'SA') }}</div>
            <div class="user-info">
              <strong>{{ (currentUser$ | async)?.displayName || 'Super Administrator' }}</strong>
              <p class="user-email">{{ (currentUser$ | async)?.email }}</p>
            </div>
          </div>
          <button class="signout-btn" (click)="signOut()" title="Sign Out of Session">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Router Outlet Viewport -->
      <main class="content-viewport">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: #0b0f19;
      color: #f8fafc;
    }
    .sidebar {
      width: 256px;
      height: 100vh;
      background: #131b2e;
      border-right: 1px solid #2a374f;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
    }
    .brand {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #2a374f;
      flex-shrink: 0;
    }
    .logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .brand-text h3 { font-size: 15px; font-weight: 800; color: #fff; line-height: 1.2; }
    .brand-text p { font-size: 11px; color: #94a3b8; }

    .nav-menu {
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .nav-heading { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; padding: 6px 12px; }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .nav-icon { font-size: 16px; }
    .nav-link:hover { background: #1e293b; color: #fff; }
    .nav-link.active {
      background: rgba(37, 99, 235, 0.15);
      color: #38bdf8;
      border-left: 3px solid #2563eb;
      font-weight: 700;
    }

    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid #2a374f;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
      background: #111726;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px;
      border-radius: 8px;
      transition: background 0.15s ease;
    }
    .user-pill:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #2563eb;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }
    .user-info { overflow: hidden; flex: 1; min-width: 0; }
    .user-info strong { display: block; font-size: 12px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { font-size: 10px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .signout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #0f172a;
      border: 1px solid #2a374f;
      color: #f87171;
      border-radius: 7px;
      padding: 7px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      width: 100%;
    }
    .signout-btn:hover { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #fca5a5; }

    .content-viewport {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  getInitials(name: string): string {
    if (!name) return 'AD';
    return name.slice(0, 2).toUpperCase();
  }

  signOut(): void {
    this.authService.signOut();
  }
}
