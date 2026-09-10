import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { LoginPageComponent } from './pages/login/login.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard.component';
import { JobsPageComponent } from './pages/jobs/jobs.component';
import { TechniciansPageComponent } from './pages/technicians/technicians.component';
import { BranchesPageComponent } from './pages/branches/branches.component';
import { BranchManagersPageComponent } from './pages/branch-managers/branch-managers.component';
import { ReportsPageComponent } from './pages/reports/reports.component';
import { SettingsPageComponent } from './pages/settings/settings.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'jobs', component: JobsPageComponent },
      { path: 'technicians', component: TechniciansPageComponent },
      { path: 'branches', component: BranchesPageComponent },
      { path: 'branch-managers', component: BranchManagersPageComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: 'settings', component: SettingsPageComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
